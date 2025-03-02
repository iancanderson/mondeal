import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  createRoom,
  joinRoom,
  toggleReady,
  handlePlayCard,
  handleEndTurn,
  getRoom,
  getAvailableRooms,
  removeRoom,
  getRooms,
} from "./roomManager";
import {
  reassignWildcard,
  executePropertySteal,
  executeDealBreaker,
  executeForcedDeal,
  collectRent,
  collectDebt,
  handleJustSayNoResponse,
} from "./gameLogic";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  ActionCardName,
  Room,
  Player,
} from "./types";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: "*", // Adjust origin for security
  },
});

// Broadcast room updates to all connected clients in the lobby
function broadcastRoomUpdate() {
  io.emit("availableRooms", getAvailableRooms());
}

// Track player socket connections to rooms
const playerRooms = new Map<string, string>(); // socketId -> roomId

// Socket.IO event handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send initial room list when client connects
  socket.emit("availableRooms", getAvailableRooms());

  socket.on("requestRooms", () => {
    socket.emit("availableRooms", getAvailableRooms());
  });

  socket.on("createRoom", (playerInfo) => {
    const result = createRoom(playerInfo);
    if (result.error) {
      socket.emit("error", result.error);
      return;
    }
    if (!result.room || !result.playerId) return;

    socket.join(result.room.roomId);
    playerRooms.set(socket.id, result.room.roomId);
    // Only send roomJoined to the creator
    socket.emit("roomJoined", {
      gameState: result.room.gameState,
      playerId: result.playerId,
    });
    // Broadcast updated room list to everyone
    broadcastRoomUpdate();
  });

  socket.on("joinRoom", (roomId, playerInfo) => {
    const { room, playerId } = joinRoom(roomId, playerInfo);
    if (!room || !playerId) {
      socket.emit(
        "error",
        "Unable to join room. Check room ID or game started."
      );
      return;
    }
    socket.join(room.roomId);
    playerRooms.set(socket.id, roomId);
    // Send roomJoined only to the joining player
    socket.emit("roomJoined", {
      gameState: room.gameState,
      playerId,
    });
    // Send updateGameState to all other players in the room
    socket.to(room.roomId).emit("updateGameState", room.gameState);
    // Broadcast updated room list to everyone
    broadcastRoomUpdate();
  });

  socket.on("toggleReady", (roomId, playerId) => {
    toggleReady(roomId, playerId);
    const room = getRoom(roomId);
    if (!room) return;
    io.to(roomId).emit("updateGameState", room.gameState);
    // If game started, update room list to remove it from available rooms
    if (room.gameState.isStarted) {
      broadcastRoomUpdate();
    }
  });

  socket.on(
    "playCard",
    (roomId, playerId, cardId, chosenColor, playAsAction) => {
      const room = getRoom(roomId);
      if (!room) return;
      // Only the current player can play
      if (
        room.gameState.players[room.gameState.currentPlayerIndex].id !==
        playerId
      ) {
        return;
      }

      // Store player's name before playing the card
      const currentPlayerName =
        room.gameState.players[room.gameState.currentPlayerIndex].name;
      // Store the card count before playing
      const cardCountBefore = room.gameState.cardsPlayedThisTurn;

      const result = handlePlayCard(
        roomId,
        playerId,
        cardId,
        chosenColor,
        playAsAction
      );

      // Send game state update
      io.to(roomId).emit("updateGameState", room.gameState);

      // If this was an action card, send a notification
      if (result?.notificationType) {
        let notificationMessage = "";

        // Use type-safe switch statement with ActionCardName
        switch (result.notificationType as ActionCardName) {
          case "Pass Go":
            notificationMessage = `${result.player} played Pass Go and drew 2 cards.`;
            break;
          case "Sly Deal":
            notificationMessage = `${result.player} played Sly Deal. They can steal a property card!`;
            break;
          case "Deal Breaker":
            notificationMessage = `${result.player} played Deal Breaker. They can steal a complete property set!`;
            break;
          case "Rent":
            if (room.gameState.pendingAction.type === "RENT") {
              const { color, amount } = room.gameState.pendingAction;
              notificationMessage = `${result.player} played Rent for ${color} properties. All other players owe $${amount}M!`;
            }
            break;
          // Add cases for other action cards as they are implemented
        }

        if (notificationMessage) {
          io.to(roomId).emit("gameNotification", notificationMessage);
        }
      }

      // If this was their third card and turn ended automatically (current player index changed)
      if (
        cardCountBefore === 2 &&
        room.gameState.pendingAction.type === "NONE" &&
        room.gameState.players[room.gameState.currentPlayerIndex].name !==
          currentPlayerName
      ) {
        const newPlayerName =
          room.gameState.players[room.gameState.currentPlayerIndex].name;
        io.to(roomId).emit(
          "gameNotification",
          `${currentPlayerName} played their 3rd card. Turn passed to ${newPlayerName}.`
        );
      }
    }
  );

  // Handle rent payment
  socket.on(
    "payRent",
    (roomId: string, payerId: string, paymentCardIds: string[]) => {
      const room = getRoom(roomId);
      if (!room) return;

      const payer = room.gameState.players.find((p) => p.id === payerId);
      const collector =
        room.gameState.players[room.gameState.currentPlayerIndex];
      if (!payer || !collector) return;

      // Calculate if this is a bankruptcy case (giving up all cards)
      const totalCards = [
        ...payer.hand,
        ...payer.moneyPile,
        ...Object.values(payer.properties).flat(),
      ];
      const isBankruptcy = paymentCardIds.length === totalCards.length;

      const success = collectRent(room.gameState, payerId, paymentCardIds);

      if (success) {
        io.to(roomId).emit("updateGameState", room.gameState);

        // Send appropriate notification based on bankruptcy status
        if (isBankruptcy) {
          io.to(roomId).emit(
            "gameNotification",
            `${payer.name} went bankrupt and surrendered all cards to ${collector.name}!`
          );
        } else {
          io.to(roomId).emit(
            "gameNotification",
            `${payer.name} paid their rent.`
          );
        }
      }
    }
  );

  socket.on("endTurn", (roomId, playerId) => {
    handleEndTurn(roomId, playerId);
    const room = getRoom(roomId);
    if (!room) return;
    io.to(roomId).emit("updateGameState", room.gameState);
  });

  socket.on("reassignWildcard", (roomId, playerId, cardId, newColor) => {
    const room = getRoom(roomId);
    if (!room) return;

    const success = reassignWildcard(
      room.gameState,
      playerId,
      cardId,
      newColor
    );
    if (success) {
      io.to(roomId).emit("updateGameState", room.gameState);
    }
  });

  socket.on(
    "executePropertySteal",
    (roomId, sourcePlayerId, targetPlayerId, targetCardId) => {
      const room = getRoom(roomId);
      if (!room) return;

      const sourcePlayer = room.gameState.players.find(
        (p) => p.id === sourcePlayerId
      );
      const targetPlayer = room.gameState.players.find(
        (p) => p.id === targetPlayerId
      );

      if (!sourcePlayer || !targetPlayer) {
        return;
      }

      const success = executePropertySteal(
        room.gameState,
        sourcePlayerId,
        targetPlayerId,
        targetCardId
      );

      if (success) {
        io.to(roomId).emit("updateGameState", room.gameState);

        // Send notification about the steal
        const notification = `${sourcePlayer.name} used Sly Deal to steal a property from ${targetPlayer.name}`;
        io.to(roomId).emit("gameNotification", notification);
      }
    }
  );

  socket.on(
    "executeDealBreaker",
    (roomId, sourcePlayerId, targetPlayerId, color) => {
      const room = getRoom(roomId);
      if (!room) return;

      const sourcePlayer = room.gameState.players.find(
        (p) => p.id === sourcePlayerId
      );
      const targetPlayer = room.gameState.players.find(
        (p) => p.id === targetPlayerId
      );

      if (!sourcePlayer || !targetPlayer) {
        return;
      }

      const success = executeDealBreaker(
        room.gameState,
        sourcePlayerId,
        targetPlayerId,
        color
      );

      if (success) {
        io.to(roomId).emit("updateGameState", room.gameState);

        // Send notification about the deal breaker
        const notification = `${sourcePlayer.name} used Deal Breaker to steal a complete property set from ${targetPlayer.name}`;
        io.to(roomId).emit("gameNotification", notification);
      }
    }
  );

  socket.on(
    "executeForcedDeal",
    (roomId, sourcePlayerId, targetPlayerId, targetCardId, myCardId) => {
      const room = getRoom(roomId);
      if (!room) return;

      const sourcePlayer = room.gameState.players.find(
        (p) => p.id === sourcePlayerId
      );
      const targetPlayer = room.gameState.players.find(
        (p) => p.id === targetPlayerId
      );

      if (!sourcePlayer || !targetPlayer) {
        return;
      }

      // Set up pending action if it's not already set
      if (room.gameState.pendingAction.type === "NONE") {
        room.gameState.pendingAction = {
          type: "FORCED_DEAL",
          playerId: sourcePlayerId,
        };
      }

      const success = executeForcedDeal(
        room.gameState,
        sourcePlayerId,
        targetPlayerId,
        targetCardId,
        myCardId
      );

      if (success) {
        io.to(roomId).emit("updateGameState", room.gameState);

        // Send notification about the forced deal
        const notification = `${sourcePlayer.name} used Forced Deal to trade a property with ${targetPlayer.name}`;
        io.to(roomId).emit("gameNotification", notification);
      }
    }
  );

  socket.on(
    "respondToAction",
    (roomId: string, playerId: string, useJustSayNo: boolean) => {
      const room = getRoom(roomId);
      if (!room) return;

      const player = room.gameState.players.find((p) => p.id === playerId);
      if (!player) return;

      const success = handleJustSayNoResponse(
        room.gameState,
        playerId,
        useJustSayNo
      );

      if (success) {
        io.to(roomId).emit("updateGameState", room.gameState);
        if (useJustSayNo) {
          io.to(roomId).emit(
            "gameNotification",
            `${player.name} used Just Say No to prevent the action!`
          );
        }
      }
    }
  );

  socket.on("updatePlayerName", (playerId, newName, uuid) => {
    // Update player name in all rooms where this player exists
    const rooms = getRooms();
    const roomsWithPlayer = rooms.filter((room: Room) =>
      room.gameState.players.some((p: Player) => p.uuid === uuid)
    );

    roomsWithPlayer.forEach((room: Room) => {
      // Update player name
      const player = room.gameState.players.find(
        (p: Player) => p.uuid === uuid
      );
      if (player) {
        player.name = newName;
        // Broadcast the updated game state to all players in the room
        io.to(room.roomId).emit("updateGameState", room.gameState);
      }
    });

    // Update available rooms list if any room creators were updated
    broadcastRoomUpdate();
  });

  // Add a new socket handler for collecting debt
  socket.on(
    "collectDebt",
    (roomId: string, sourcePlayerId: string, targetPlayerId: string, paymentCardIds: string[]) => {
      const room = getRoom(roomId);
      if (!room) return;

      const sourcePlayer = room.gameState.players.find((p) => p.id === sourcePlayerId);
      const targetPlayer = room.gameState.players.find((p) => p.id === targetPlayerId);

      if (!sourcePlayer || !targetPlayer) return;

      // Calculate if this is a bankruptcy case (giving up all cards)
      const totalCards = [
        ...targetPlayer.moneyPile,
        ...Object.values(targetPlayer.properties).flatMap(set => set.cards),
      ];
      const isBankruptcy = paymentCardIds.length === totalCards.length;

      const success = collectDebt(
        room.gameState,
        sourcePlayerId,
        targetPlayerId,
        paymentCardIds
      );

      if (success) {
        io.to(roomId).emit("updateGameState", room.gameState);

        // Send appropriate notification based on bankruptcy status
        if (isBankruptcy) {
          io.to(roomId).emit(
            "gameNotification",
            `${targetPlayer.name} went bankrupt and surrendered all cards to pay ${sourcePlayer.name}'s $5M debt!`
          );
        } else {
          io.to(roomId).emit(
            "gameNotification",
            `${targetPlayer.name} paid $5M debt to ${sourcePlayer.name}.`
          );
        }
      }
    }
  );

  // Handle disconnections
  socket.on("disconnect", () => {
    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      const room = getRoom(roomId);
      if (room && room.gameState.isStarted) {
        // If game was in progress, notify other players and remove the room
        socket
          .to(roomId)
          .emit("error", "A player has left the game. Game ended.");
        removeRoom(roomId);
        broadcastRoomUpdate();
      }
      playerRooms.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
