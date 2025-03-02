import socketIOClient from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

const socket = socketIOClient("http://localhost:4000");
export { socket };
