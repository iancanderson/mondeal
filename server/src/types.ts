export type CardType = "PROPERTY" | "MONEY" | "ACTION" | "RENT";

export type ActionCardName =
  | "Deal Breaker"
  | "Just Say No"
  | "Sly Deal"
  | "Forced Deal"
  | "Debt Collector"
  | "It's My Birthday"
  | "Double The Rent"
  | "House"
  | "Hotel"
  | "Pass Go"
  | "Rent";

// Add a type for different action states
export type ActionState =
  | {
      type: "NONE";
    }
  | {
      type: "SLY_DEAL";
      playerId: string;
    }
  | {
      type: "DEAL_BREAKER";
      playerId: string;
    }
  | {
      type: "RENT";
      playerId: string;
      color: string;
      amount: number;
    };

export interface Card {
  id: string;
  name: string;
  type: CardType;
  value: number;
  color?: string; // For property cards
  rentColors?: string[]; // For rent cards
  isWildcard?: boolean; // For property wild cards
}

export interface Player {
  id: string;
  name: string;
  uuid: string; // Add persistent UUID
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
  pendingAction: ActionState;
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
  gameNotification: (message: string) => void;
  error: (msg: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (playerInfo: { name: string; uuid: string }) => void;
  joinRoom: (
    roomId: string,
    playerInfo: { name: string; uuid: string }
  ) => void;
  toggleReady: (roomId: string, playerId: string) => void;
  playCard: (
    roomId: string,
    playerId: string,
    cardId: string,
    chosenColor?: string,
    playAsAction?: boolean
  ) => void;
  reassignWildcard: (
    roomId: string,
    playerId: string,
    cardId: string,
    newColor: string
  ) => void;
  executePropertySteal: (
    roomId: string,
    sourcePlayerId: string,
    targetPlayerId: string,
    targetCardId: string
  ) => void;
  executeDealBreaker: (
    roomId: string,
    sourcePlayerId: string,
    targetPlayerId: string,
    color: string
  ) => void;
  payRent: (
    roomId: string,
    payerId: string,
    paymentCardIds: string[]
  ) => void;
  endTurn: (roomId: string, playerId: string) => void;
  updatePlayerName: (playerId: string, newName: string, uuid: string) => void;
  requestRooms: () => void;
}
