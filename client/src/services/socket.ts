import { io } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../types";

// Point to your server (adjust if deployed, etc.)
export const socket = io<ServerToClientEvents, ClientToServerEvents>(
  "http://localhost:4000"
);
