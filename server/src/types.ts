export enum CardType {
  PROPERTY = "PROPERTY",
  MONEY = "MONEY",
  ACTION = "ACTION",
  RENT = "RENT",
}

export enum PropertyColor {
  BROWN = "Brown",
  BLUE = "Blue",
  GREEN = "Green",
  YELLOW = "Yellow",
  RED = "Red",
  ORANGE = "Orange",
  PURPLE = "Purple",
  LIGHT_BLUE = "LightBlue",
  RAILROAD = "Railroad",
  UTILITY = "Utility",
}

export enum ActionCardName {
  DEAL_BREAKER = "Deal Breaker",
  JUST_SAY_NO = "Just Say No",
  SLY_DEAL = "Sly Deal",
  FORCED_DEAL = "Forced Deal",
  DEBT_COLLECTOR = "Debt Collector",
  ITS_MY_BIRTHDAY = "It's My Birthday",
  DOUBLE_THE_RENT = "Double The Rent",
  HOUSE = "House",
  HOTEL = "Hotel",
  PASS_GO = "Pass Go",
  RENT = "Rent",
}

interface BaseCard {
  id: string;
  value: number;
}

/** Property Cards */
export interface PropertyCard extends BaseCard {
  type: CardType.PROPERTY;
  name: string;
  color: PropertyColor;
  isWildcard?: boolean;
}

/** Money Cards */
export interface MoneyCard extends BaseCard {
  type: CardType.MONEY;
  name: string; // e.g., "$1M", "$2M", etc.
}

/** Action Cards */
export interface ActionCard extends BaseCard {
  type: CardType.ACTION;
  name: ActionCardName;
}

/** Rent Cards */
export interface RentCard extends BaseCard {
  type: CardType.RENT;
  name: string;
  rentColors: PropertyColor[];
}

/** Discriminated union for all cards */
export type Card = PropertyCard | MoneyCard | ActionCard | RentCard;

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
      remainingPayers: string[];
      isDoubled?: boolean;
    }
  | {
      type: "DOUBLE_RENT_PENDING";
      playerId: string;
    }
  | {
      type: "BIRTHDAY";
      playerId: string;
      amount: number;
      remainingPayers: string[];
    }
  | {
      type: "DISCARD_NEEDED";
      playerId: string;
    }
  | {
      type: "JUST_SAY_NO_OPPORTUNITY";
      playerId: string;
      actionType:
        | "DEAL_BREAKER"
        | "SLY_DEAL"
        | "RENT"
        | "FORCED_DEAL"
        | "DEBT_COLLECTOR"
        | "BIRTHDAY";
      sourcePlayerId: string;
      targetCardId?: string;
      myCardId?: string;
      color?: string;
      amount?: number;
    };

export interface PropertySet {
  cards: Card[];
  houses: number;
  hotels: number;
}

export interface Player {
  id: string;
  name: string;
  uuid: string; // Add persistent UUID
  hand: Card[];
  properties: Record<string, PropertySet[]>; // color -> array of property sets
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
  executeForcedDeal: (
    roomId: string,
    sourcePlayerId: string,
    targetPlayerId: string,
    targetCardId: string,
    myCardId: string
  ) => void;
  payRent: (roomId: string, payerId: string, paymentCardIds: string[]) => void;
  payBirthdayGift: (
    roomId: string,
    payerId: string,
    paymentCardIds: string[]
  ) => void;
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
  discardCards: (roomId: string, playerId: string, cardIds: string[]) => void;
}
