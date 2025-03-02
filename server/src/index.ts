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
import { ClientToServerEvents, ServerToClientEvents } from "./types";

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

  socket.on("playCard", (roomId, playerId, cardId) => {
    handlePlayCard(roomId, playerId, cardId);
    const room = getRoom(roomId);
    if (!room) return;
    io.to(roomId).emit("updateGameState", room.gameState);
  });

  socket.on("endTurn", (roomId, playerId) => {
    handleEndTurn(roomId, playerId);
    const room = getRoom(roomId);
    if (!room) return;
    io.to(roomId).emit("updateGameState", room.gameState);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
