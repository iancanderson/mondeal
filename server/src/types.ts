export type CardType = "PROPERTY" | "MONEY" | "ACTION";

export interface Card {
  id: string;
  name: string;
  type: CardType;
  value: number;
  color?: string; // For property cards
  isWildcard?: boolean; // For property wild cards
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  properties: Record<string, Card[]>; // color -> array of property cards
  moneyPile: Card[];
  isReady: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  isStarted: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number; // Track number of cards played this turn
  wildCardReassignedThisTurn: boolean; // Track if a wild card was reassigned this turn
}

export interface Room {
  roomId: string;
  gameState: GameState;
}

export interface RoomInfo {
  roomId: string;
  playerCount: number;
  creatorName: string;
  isStarted: boolean;
}

export interface ServerToClientEvents {
  roomJoined: (data: { gameState: GameState; playerId: string }) => void;
  updateGameState: (gameState: GameState) => void;
  availableRooms: (rooms: RoomInfo[]) => void;
  error: (msg: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  toggleReady: (roomId: string, playerId: string) => void;
  playCard: (
    roomId: string,
    playerId: string,
    cardId: string,
    chosenColor?: string
  ) => void;
  reassignWildcard: (
    roomId: string,
    playerId: string,
    cardId: string,
    newColor: string
  ) => void;
  endTurn: (roomId: string, playerId: string) => void;
  requestRooms: () => void;
}
