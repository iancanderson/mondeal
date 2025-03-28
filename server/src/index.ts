import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
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
  collectBirthdayPayment,
  startTurn,
  payDebt,
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

// Set up static file serving for the client build
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// Serve index.html for any routes not explicitly handled to support client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

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

// Function to notify room of updates
const notifyRoom = (roomId: string) => {
  const room = getRoom(roomId);
  if (room) {
    io.to(roomId).emit("updateGameState", room.gameState);
  }
};

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
        // Flatten arrays of property cards from all property sets
        ...Object.values(payer.properties).flatMap((propertySets) =>
          propertySets.flatMap((set) => set.cards)
        ),
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
    (roomId: string, playerId: string, targetPlayerId: string) => {
      const room = getRoom(roomId);
      if (!room) return;

      const success = collectDebt(room.gameState, playerId, targetPlayerId);
      if (success) {
        notifyRoom(roomId);
      }
    }
  );

  // Add socket handler for birthday payments
  socket.on(
    "payBirthdayGift",
    (roomId: string, payerId: string, paymentCardIds: string[]) => {
      const room = getRoom(roomId);
      if (!room) return;

      const payer = room.gameState.players.find((p) => p.id === payerId);
      const birthdayPerson = room.gameState.players.find(
        (p) =>
          room.gameState.pendingAction.type === "BIRTHDAY" &&
          p.id === room.gameState.pendingAction.playerId
      );

      if (!payer || !birthdayPerson) return;

      // Calculate if this is a bankruptcy case (giving up all cards)
      const totalCards = [
        ...payer.moneyPile,
        // Flatten arrays of property cards from all property sets
        ...Object.values(payer.properties).flatMap((propertySets) =>
          propertySets.flatMap((set) => set.cards)
        ),
      ];
      const isBankruptcy = paymentCardIds.length === totalCards.length;

      const success = collectBirthdayPayment(
        room.gameState,
        payerId,
        paymentCardIds
      );

      if (success) {
        io.to(roomId).emit("updateGameState", room.gameState);

        // Send appropriate notification based on bankruptcy status
        if (isBankruptcy) {
          io.to(roomId).emit(
            "gameNotification",
            `${payer.name} went bankrupt and surrendered all cards to ${birthdayPerson.name}!`
          );
        } else {
          io.to(roomId).emit(
            "gameNotification",
            `${payer.name} paid ${birthdayPerson.name} a birthday gift.`
          );
        }
      }
    }
  );

  // Add after other socket.on handlers
  socket.on(
    "discardCards",
    (roomId: string, playerId: string, cardIds: string[]) => {
      const room = getRoom(roomId);
      if (!room) return;

      const player = room.gameState.players.find((p) => p.id === playerId);
      if (!player) return;

      // Remove cards from player's hand
      for (const cardId of cardIds) {
        const cardIndex = player.hand.findIndex((c) => c.id === cardId);
        if (cardIndex !== -1) {
          const card = player.hand.splice(cardIndex, 1)[0];
          room.gameState.discardPile.push(card);
        }
      }

      // Only advance turn if we're down to 7 cards
      if (player.hand.length <= 7) {
        room.gameState.pendingAction = { type: "NONE" };
        room.gameState.currentPlayerIndex =
          (room.gameState.currentPlayerIndex + 1) %
          room.gameState.players.length;
        startTurn(room.gameState);
      }

      io.to(roomId).emit("updateGameState", room.gameState);
      io.to(roomId).emit(
        "gameNotification",
        `${player.name} discarded ${cardIds.length} card${
          cardIds.length !== 1 ? "s" : ""
        }.`
      );
    }
  );

  socket.on(
    "payDebt",
    (roomId: string, playerId: string, paymentCardIds: string[]) => {
      const room = getRoom(roomId);
      if (!room) return;

      const success = payDebt(room.gameState, playerId, paymentCardIds);
      if (success) {
        notifyRoom(roomId);

        // Send notification about debt payment
        const debtor = room.gameState.players.find((p) => p.id === playerId);
        const collector = room.gameState.players.find((p) => {
          const action = room.gameState.pendingAction;
          return action.type === "DEBT_COLLECTOR"
            ? p.id === action.playerId
            : false;
        });

        if (debtor && collector) {
          io.to(roomId).emit(
            "gameNotification",
            `${debtor.name} paid $5M debt to ${collector.name}.`
          );
        }
      }
    }
  );

  // Add this after the other socket.on handlers
  socket.on("rejoinGame", (roomId: string, playerId: string) => {
    console.log(`Player ${playerId} attempting to rejoin room ${roomId}`);
    const room = getRoom(roomId);
    if (!room) {
      socket.emit("error", "Room not found. The game may have ended.");
      return;
    }

    // Check if the player exists in this room
    const player = room.gameState.players.find((p) => p.id === playerId);
    if (!player) {
      socket.emit("error", "Player not found in this game.");
      return;
    }

    // Join the socket to the room
    socket.join(roomId);
    playerRooms.set(socket.id, roomId);

    // Send the current game state to the reconnecting player
    socket.emit("roomJoined", {
      gameState: room.gameState,
      playerId: playerId,
    });

    // Notify other players that someone has rejoined
    if (player) {
      socket
        .to(roomId)
        .emit("gameNotification", `${player.name} has rejoined the game.`);
    }
    console.log(`Player ${playerId} successfully rejoined room ${roomId}`);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      const room = getRoom(roomId);

      // Don't end the game when a player disconnects; allow them to rejoin later
      if (room) {
        // Just notify other players that someone disconnected
        const socketIdToPlayer = new Map();
        Object.keys(io.sockets.adapter.rooms.get(roomId) || {}).forEach(
          (id) => {
            socketIdToPlayer.set(id, playerRooms.get(id));
          }
        );

        // Find which player disconnected by comparing with current connections
        const disconnectedPlayer = room.gameState.players.find(
          (p) => !Array.from(socketIdToPlayer.values()).includes(p.id)
        );

        if (disconnectedPlayer) {
          socket
            .to(roomId)
            .emit(
              "gameNotification",
              `${disconnectedPlayer.name} disconnected. They can rejoin later.`
            );
        } else {
          socket
            .to(roomId)
            .emit(
              "gameNotification",
              "A player disconnected. They can rejoin later."
            );
        }
      }

      // Remove this socket's connection from the tracking map
      playerRooms.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
