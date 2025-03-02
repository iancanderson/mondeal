// Mirror minimal shared types on client side
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

export interface Card {
  id: string;
  name: string;
  type: CardType;
  value: number;
  color?: string;
  rentColors?: string[];
  isWildcard?: boolean;
}

export interface Player {
  id: string;
  name: string;
  uuid: string;
  hand: Card[];
  properties: Record<string, PropertySet>;
  moneyPile: Card[];
  isReady: boolean;
}

export interface PropertySet {
  cards: Card[];
  houses: number;
  hotels: number;
}

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
      type: "FORCED_DEAL";
      playerId: string;
    }
  | {
      type: "DEBT_COLLECTOR";
      playerId: string;
      amount: number;
    }
  | {
      type: "RENT";
      playerId: string;
      color: string;
      amount: number;
    }
  | {
      type: "JUST_SAY_NO_OPPORTUNITY";
      playerId: string;
      actionType: "DEAL_BREAKER" | "SLY_DEAL" | "RENT" | "FORCED_DEAL" | "DEBT_COLLECTOR";
      sourcePlayerId: string;
      targetCardId?: string;
      myCardId?: string;
      color?: string;
      amount?: number;
    };

export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  isStarted: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
  wildCardReassignedThisTurn: boolean;
  pendingAction: ActionState;
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
  executeForcedDeal: (
    roomId: string,
    sourcePlayerId: string,
    targetPlayerId: string,
    targetCardId: string,
    myCardId: string
  ) => void;
  payRent: (roomId: string, payerId: string, paymentCardIds: string[]) => void;
  endTurn: (roomId: string, playerId: string) => void;
  updatePlayerName: (playerId: string, newName: string, uuid: string) => void;
  requestRooms: () => void;
  respondToAction: (
    roomId: string,
    playerId: string,
    useJustSayNo: boolean
  ) => void;
  collectDebt: (
    roomId: string,
    sourcePlayerId: string,
    targetPlayerId: string,
    paymentCardIds: string[]
  ) => void;
}
