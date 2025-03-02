import socketIOClient from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

// Dynamically determine the server URL based on the current hostname
const getServerUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:4000`;
};

const socket = socketIOClient(getServerUrl());
export { socket };
