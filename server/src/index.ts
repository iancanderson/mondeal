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
} from "./roomManager";
import { reassignWildcard, executePropertySteal } from "./gameLogic";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  ActionCardName,
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

// Socket.IO event handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send initial room list when client connects
  socket.emit("availableRooms", getAvailableRooms());

  socket.on("requestRooms", () => {
    socket.emit("availableRooms", getAvailableRooms());
  });

  socket.on("createRoom", (playerName) => {
    const { room, playerId } = createRoom(playerName);
    socket.join(room.roomId);
    // Only send roomJoined to the creator
    socket.emit("roomJoined", {
      gameState: room.gameState,
      playerId,
    });
    // Broadcast updated room list to everyone
    broadcastRoomUpdate();
  });

  socket.on("joinRoom", (roomId, playerName) => {
    const { room, playerId } = joinRoom(roomId, playerName);
    if (!room || !playerId) {
      socket.emit(
        "error",
        "Unable to join room. Check room ID or game started."
      );
      return;
    }
    socket.join(room.roomId);
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
      const currentPlayerName = room.gameState.players[room.gameState.currentPlayerIndex].name;
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
          // Add cases for other action cards as they are implemented
        }

        if (notificationMessage) {
          io.to(roomId).emit("gameNotification", notificationMessage);
        }
      }
      
      // If this was their third card and turn ended automatically (current player index changed)
      if (cardCountBefore === 2 && 
          room.gameState.pendingAction.type === "NONE" && 
          room.gameState.players[room.gameState.currentPlayerIndex].name !== currentPlayerName) {
        const newPlayerName = room.gameState.players[room.gameState.currentPlayerIndex].name;
        io.to(roomId).emit(
          "gameNotification", 
          `${currentPlayerName} played their 3rd card. Turn passed to ${newPlayerName}.`
        );
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
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
