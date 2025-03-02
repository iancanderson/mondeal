// Mirror minimal shared types on client side
export type CardType = "PROPERTY" | "MONEY" | "ACTION";

export interface Card {
  id: string;
  name: string;
  type: CardType;
  value: number;
  color?: string;
  isWildcard?: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  properties: Record<string, Card[]>;
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
  cardsPlayedThisTurn: number;
}

export interface RoomInfo {
  roomId: string;
  playerCount: number;
  creatorName: string;
  isStarted: boolean;
}

// Socket events
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
  playCard: (roomId: string, playerId: string, cardId: string) => void;
  endTurn: (roomId: string, playerId: string) => void;
  requestRooms: () => void;
}
