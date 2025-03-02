import { v4 as uuidv4 } from "uuid";
import { Room, GameState, Player, RoomInfo } from "./types";
import {
  createDeck,
  dealInitialCards,
  startTurn,
  playCard,
  endTurn,
} from "./gameLogic";

const rooms: Room[] = [];

/**
 * Get a list of available rooms that haven't started yet
 */
export function getAvailableRooms(): RoomInfo[] {
  return rooms
    .filter((room) => !room.gameState.isStarted)
    .map((room) => ({
      roomId: room.roomId,
      playerCount: room.gameState.players.length,
      creatorName: room.gameState.players[0].name,
      isStarted: room.gameState.isStarted,
    }));
}

/**
 * Create a new room with a new GameState
 */
export function createRoom(playerName: string): {
  room: Room;
  playerId: string;
} {
  const roomId = uuidv4();
  const playerId = uuidv4();

  const newRoom: Room = {
    roomId,
    gameState: {
      roomId,
      players: [
        {
          id: playerId,
          name: playerName,
          hand: [],
          properties: {},
          moneyPile: [],
          isReady: false,
        },
      ],
      deck: [],
      discardPile: [],
      currentPlayerIndex: 0,
      isStarted: false,
      cardsPlayedThisTurn: 0
    },
  };
  rooms.push(newRoom);
  return { room: newRoom, playerId };
}

/**
 * Join an existing room
 */
export function joinRoom(
  roomId: string,
  playerName: string
): { room?: Room; playerId?: string } {
  const room = rooms.find((r) => r.roomId === roomId);
  if (!room) return {};

  // If the game already started, do not allow join
  if (room.gameState.isStarted) {
    return {};
  }

  const playerId = uuidv4();
  room.gameState.players.push({
    id: playerId,
    name: playerName,
    hand: [],
    properties: {},
    moneyPile: [],
    isReady: false,
  });

  return { room, playerId };
}

export function toggleReady(roomId: string, playerId: string) {
  const room = rooms.find((r) => r.roomId === roomId);
  if (!room) return;

  const player = room.gameState.players.find((p) => p.id === playerId);
  if (!player) return;

  // Only toggle the ready state for the player who clicked
  player.isReady = !player.isReady;

  // Check if all players are ready and at least 2 players are in the game
  const allReady = room.gameState.players.every((p) => p.isReady);
  if (
    allReady &&
    room.gameState.players.length >= 2 &&
    !room.gameState.isStarted
  ) {
    // Start the game
    room.gameState.isStarted = true;
    room.gameState.deck = createDeck();
    dealInitialCards(room.gameState);
    // The first player's turn, draw 2
    startTurn(room.gameState);
  }
}

export function handlePlayCard(
  roomId: string,
  playerId: string,
  cardId: string
) {
  const room = rooms.find((r) => r.roomId === roomId);
  if (!room) return;
  // Only the current player can play
  if (
    room.gameState.players[room.gameState.currentPlayerIndex].id !== playerId
  ) {
    return;
  }
  playCard(room.gameState, playerId, cardId);
}

export function handleEndTurn(roomId: string, playerId: string) {
  const room = rooms.find((r) => r.roomId === roomId);
  if (!room) return;
  // Only the current player can end turn
  if (
    room.gameState.players[room.gameState.currentPlayerIndex].id !== playerId
  ) {
    return;
  }
  endTurn(room.gameState);
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.find((r) => r.roomId === roomId);
}

export function getRooms() {
  return rooms;
}
