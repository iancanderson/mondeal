import socketIOClient from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

// Dynamically determine the server URL based on the current hostname
const getServerUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:4000`;
};

const socket = socketIOClient(getServerUrl());

// Save session data to localStorage for reconnection
export const saveGameSession = (roomId: string, playerId: string) => {
  localStorage.setItem('gameSession', JSON.stringify({ roomId, playerId }));
};

// Get saved session data
export const getSavedGameSession = () => {
  const session = localStorage.getItem('gameSession');
  if (session) {
    return JSON.parse(session);
  }
  return null;
};

// Clear session data when leaving a game
export const clearGameSession = () => {
  localStorage.removeItem('gameSession');
};

// Try to rejoin a game using saved session data
export const rejoinGame = () => {
  const session = getSavedGameSession();
  if (session && session.roomId && session.playerId) {
    socket.emit('rejoinGame', session.roomId, session.playerId);
    return true;
  }
  return false;
};

export { socket };
