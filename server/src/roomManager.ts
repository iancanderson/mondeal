import { v4 as uuidv4 } from "uuid";
import {
  Room,
  GameState,
  Player,
  RoomInfo,
  ActionCardName,
  PropertyColor,
  PropertySet,
} from "./types";
import {
  createDeck,
  dealInitialCards,
  startTurn,
  playCard,
  endTurn,
} from "./gameLogic";

const rooms: Room[] = [];
const roomCreators = new Map<string, string>(); // uuid -> roomId

// Helper function to create empty properties object
function createEmptyProperties(): Record<PropertyColor, PropertySet[]> {
  return Object.values(PropertyColor).reduce((acc, color) => {
    acc[color] = [];
    return acc;
  }, {} as Record<PropertyColor, PropertySet[]>);
}

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
export function createRoom(playerInfo: { name: string; uuid: string }): {
  room?: Room;
  playerId?: string;
  error?: string;
} {
  // Check if player already created a room
  if (roomCreators.has(playerInfo.uuid)) {
    const existingRoomId = roomCreators.get(playerInfo.uuid);
    // Make sure the room still exists
    const roomExists = rooms.some((room) => room.roomId === existingRoomId);

    if (roomExists) {
      return { error: "You already have an active room" };
    } else {
      // If the room doesn't exist anymore, remove the entry from the map
      roomCreators.delete(playerInfo.uuid);
    }
  }

  const roomId = uuidv4();
  const playerId = uuidv4();
  const newRoom: Room = {
    roomId,
    gameState: {
      roomId,
      players: [
        {
          id: playerId,
          name: playerInfo.name,
          uuid: playerInfo.uuid,
          hand: [],
          properties: createEmptyProperties(),
          moneyPile: [],
          isReady: false,
        },
      ],
      deck: [],
      discardPile: [],
      currentPlayerIndex: 0,
      isStarted: false,
      cardsPlayedThisTurn: 0,
      pendingAction: { type: "NONE" },
    },
  };
  rooms.push(newRoom);
  roomCreators.set(playerInfo.uuid, roomId);
  return { room: newRoom, playerId };
}

/**
 * Remove a room and clean up associated data
 */
export function removeRoom(roomId: string) {
  const roomIndex = rooms.findIndex((r) => r.roomId === roomId);
  if (roomIndex !== -1) {
    const room = rooms[roomIndex];
    // Remove the creator's UUID from tracking
    const creator = room.gameState.players[0];
    roomCreators.delete(creator.uuid);
    // Remove the room
    rooms.splice(roomIndex, 1);
  }
}

/**
 * Join an existing room
 */
export function joinRoom(
  roomId: string,
  playerInfo: { name: string; uuid: string }
): { room?: Room; playerId?: string } {
  const room = rooms.find((r) => r.roomId === roomId);
  if (!room) return {};

  // If the game already started, do not allow join
  if (room.gameState.isStarted) {
    return {};
  }

  // Check if player already exists in the room
  const existingPlayer = room.gameState.players.find(
    (p) => p.uuid === playerInfo.uuid
  );
  if (existingPlayer) {
    return { room, playerId: existingPlayer.id };
  }

  const playerId = uuidv4();
  room.gameState.players.push({
    id: playerId,
    name: playerInfo.name,
    uuid: playerInfo.uuid,
    hand: [],
    properties: createEmptyProperties(),
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
  cardId: string,
  chosenColor?: PropertyColor,
  playAsAction: boolean = false
): {
  success: boolean;
  notificationType?: ActionCardName;
  player?: string;
} {
  const room = rooms.find((r) => r.roomId === roomId);
  if (!room) return { success: false };

  // Only the current player can play
  if (
    room.gameState.players[room.gameState.currentPlayerIndex].id !== playerId
  ) {
    return { success: false };
  }

  const player = room.gameState.players.find((p) => p.id === playerId);
  if (!player) return { success: false };

  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return { success: false };

  // For wild card properties, ensure a color is chosen
  if (card.type === "PROPERTY" && card.isWildcard && !chosenColor) {
    return { success: false };
  }

  // Store result for action notification
  const { success } = playCard(
    room.gameState,
    playerId,
    cardId,
    chosenColor,
    playAsAction
  );

  // Return notification info for action cards
  if (success && card.type === "ACTION" && playAsAction) {
    return {
      success: true,
      notificationType: card.name as ActionCardName,
      player: player.name,
    };
  }

  return { success };
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
