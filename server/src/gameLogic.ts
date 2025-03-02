import { Card, Player, GameState, ActionCardName } from "./types";
import { v4 as uuidv4 } from "uuid";

/**
 * Create an initial deck of simplified Monopoly Deal cards.
 * Adjust as needed for more realistic or complete sets.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  // Property cards with real Monopoly colors and names
  const properties = {
    Brown: ["Mediterranean Avenue", "Baltic Avenue"],
    Blue: ["Boardwalk", "Park Place"],
    Green: ["Pacific Avenue", "North Carolina Avenue", "Pennsylvania Avenue"],
    Yellow: ["Atlantic Avenue", "Ventnor Avenue", "Marvin Gardens"],
    Red: ["Kentucky Avenue", "Indiana Avenue", "Illinois Avenue"],
    Orange: ["St. James Place", "Tennessee Avenue", "New York Avenue"],
    Purple: ["St. Charles Place", "Virginia Avenue", "States Avenue"],
    LightBlue: ["Connecticut Avenue", "Vermont Avenue", "Oriental Avenue"],
    Railroad: [
      "Reading Railroad",
      "Pennsylvania Railroad",
      "B&O Railroad",
      "Short Line",
    ],
    Utility: ["Electric Company", "Water Works"],
  };

  // Add property cards
  Object.entries(properties).forEach(([color, propertyNames]) => {
    propertyNames.forEach((name) => {
      deck.push({
        id: uuidv4(),
        name,
        type: "PROPERTY",
        value: color === "Railroad" || color === "Utility" ? 2 : 3,
        color,
      });
    });
  });

  // Add rent cards
  const rentGroups = [
    { colors: ["Brown", "LightBlue"], count: 2 },
    { colors: ["Purple", "Orange"], count: 2 },
    { colors: ["Red", "Yellow"], count: 2 },
    { colors: ["Green", "Blue"], count: 2 },
    { colors: ["Railroad", "Utility"], count: 2 },
  ];

  rentGroups.forEach(({ colors, count }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: uuidv4(),
        name: `${colors.join("/")} Rent`,
        type: "RENT",
        value: 1,
        rentColors: colors,
      });
    }
  });

  // Add wild card properties (2 of each)
  const wildcardNames = [
    "Multi-Color Property 1",
    "Multi-Color Property 2",
    "Multi-Color Property 3",
    "Multi-Color Property 4",
  ];
  wildcardNames.forEach((name) => {
    deck.push({
      id: uuidv4(),
      name,
      type: "PROPERTY",
      value: 4,
      isWildcard: true,
    });
  });

  // Add money cards with real values
  const moneyValues = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5];
  moneyValues.forEach((value) => {
    deck.push({
      id: uuidv4(),
      name: `$${value}M`,
      type: "MONEY",
      value,
    });
  });

  // Add action cards with real names
  const actionCards: ActionCardName[] = [
    "Deal Breaker",
    "Just Say No",
    "Sly Deal",
    "Forced Deal",
    "Debt Collector",
    "It's My Birthday",
    "Double The Rent",
    "House",
    "Hotel",
    "Pass Go",
  ];

  actionCards.forEach((name) => {
    deck.push({
      id: uuidv4(),
      name,
      type: "ACTION",
      value: 1,
    });
  });

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function dealInitialCards(gameState: GameState) {
  // Give each player 5 cards initially
  for (const player of gameState.players) {
    for (let i = 0; i < 5; i++) {
      if (gameState.deck.length > 0) {
        const card = gameState.deck.pop()!;
        player.hand.push(card);
      }
    }
  }
}

/**
 * Checks if a player has 3 full property sets.
 * For simplicity, we assume a full set is 3 properties of the same color.
 */
function getRequiredSetSize(color: string): number {
  switch (color) {
    case "Brown":
    case "Blue":
    case "Utility":
      return 2;
    case "Railroad":
      return 4;
    default:
      return 3;
  }
}

export function getCompletedSetCount(player: Player): number {
  let completedSets = 0;
  for (const color in player.properties) {
    const requiredSize = getRequiredSetSize(color);
    if (player.properties[color].length >= requiredSize) {
      completedSets++;
    }
  }
  return completedSets;
}

export function checkWinCondition(player: Player): boolean {
  return getCompletedSetCount(player) >= 3;
}

/**
 * Executes typical start-of-turn logic: draw 2 cards (if deck available).
 */
export function startTurn(gameState: GameState) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  for (let i = 0; i < 2; i++) {
    if (gameState.deck.length > 0) {
      const card = gameState.deck.pop()!;
      currentPlayer.hand.push(card);
    }
  }
  // Reset turn counters
  gameState.cardsPlayedThisTurn = 0;
  gameState.wildCardReassignedThisTurn = false;
}

/**
 * Calculate rent for a property color
 */
function calculateRent(properties: Card[], color: string): number {
  const count = properties.length;
  const requiredSize = getRequiredSetSize(color);
  const isComplete = count >= requiredSize;

  // Base rent values for each color
  const baseRents: Record<string, number[]> = {
    Brown: [1, 2],
    LightBlue: [1, 2, 3],
    Purple: [1, 2, 4],
    Orange: [1, 3, 5],
    Red: [2, 3, 6],
    Yellow: [2, 4, 6],
    Green: [2, 4, 7],
    Blue: [3, 8],
    Railroad: [1, 2, 3, 4],
    Utility: [1, 2],
  };

  // Get the base rent based on property count, capped at the required set size
  const rentIndex = Math.min(count, requiredSize) - 1;
  const baseRent = baseRents[color][rentIndex];

  // Double the rent if it's a complete set
  return isComplete ? baseRent * 2 : baseRent;
}

/**
 * Handle playing a card from hand to property/money pile.
 */
export function playCard(
  gameState: GameState,
  playerId: string,
  cardId: string,
  chosenColor?: string, // Optional parameter for wild cards or rent cards
  playAsAction: boolean = false // Optional parameter for action cards
): { success: boolean; notificationType?: ActionCardName; player?: string } {
  // Check if player has already played 3 cards
  if (gameState.cardsPlayedThisTurn >= 3) {
    return { success: false };
  }

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return { success: false };

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return { success: false };

  const card = player.hand[cardIndex];

  // For wild card properties, we need a chosen color
  if (card.type === "PROPERTY" && card.isWildcard && !chosenColor) {
    return { success: false };
  }

  // For rent cards played as action, validate:
  // 1. We need a chosen color from their available colors
  // 2. Player must own at least one property of that color
  if (card.type === "RENT" && playAsAction) {
    if (!chosenColor || !card.rentColors?.includes(chosenColor)) {
      return { success: false };
    }

    // Check if player owns any properties of the chosen color
    const playerProperties = player.properties[chosenColor] || [];
    if (playerProperties.length === 0) {
      return { success: false };
    }
  }

  // Remove from player's hand
  player.hand.splice(cardIndex, 1);

  if (card.type === "PROPERTY") {
    const propertyColor = card.isWildcard ? chosenColor! : card.color!;
    if (!player.properties[propertyColor]) {
      player.properties[propertyColor] = [];
    }
    player.properties[propertyColor].push(card);
  } else if (card.type === "RENT" && playAsAction && chosenColor) {
    // When played as an action, add to the discard pile
    gameState.discardPile.push(card);

    // Calculate rent amount for the chosen color
    const playerProperties = player.properties[chosenColor] || [];
    const rentAmount = calculateRent(playerProperties, chosenColor);

    // Check if any other player has Just Say No before setting up rent action
    const otherPlayers = gameState.players.filter((p) => p.id !== playerId);
    const playerWithJustSayNo = otherPlayers.find((p) => getJustSayNoCard(p));

    if (playerWithJustSayNo) {
      gameState.pendingAction = {
        type: "JUST_SAY_NO_OPPORTUNITY",
        playerId: playerWithJustSayNo.id,
        actionType: "RENT",
        sourcePlayerId: playerId,
        color: chosenColor,
        amount: rentAmount,
      };
    } else {
      // Set up normal rent action
      gameState.pendingAction = {
        type: "RENT",
        playerId,
        color: chosenColor,
        amount: rentAmount,
      };
    }
  } else if (card.type === "ACTION" && playAsAction) {
    // When played as an action, add to the discard pile
    gameState.discardPile.push(card);

    // Handle specific action card effects using the typed name
    switch (card.name as ActionCardName) {
      case "Pass Go":
        handlePassGoAction(gameState, player);
        break;
      case "Sly Deal":
        // Set up pending action for Sly Deal
        gameState.pendingAction = {
          type: "SLY_DEAL",
          playerId: playerId,
        };
        break;
      case "Deal Breaker":
        // Set up pending action for Deal Breaker
        gameState.pendingAction = {
          type: "DEAL_BREAKER",
          playerId: playerId,
        };
        break;
      // Other action cards can be added here
    }
  } else {
    // Money cards and action cards played as money go to money pile
    player.moneyPile.push(card);
  }

  gameState.cardsPlayedThisTurn++;

  // Automatically end turn if this was the player's third card
  if (gameState.cardsPlayedThisTurn >= 3) {
    // Don't automatically end turn if there's a pending action
    if (gameState.pendingAction.type === "NONE") {
      endTurn(gameState);
    }
  }

  // Return notification info for action cards
  if (card.type === "ACTION" && playAsAction) {
    return {
      success: true,
      notificationType: card.name as ActionCardName,
      player: player.name,
    };
  }

  if (card.type === "RENT" && playAsAction) {
    return {
      success: true,
      notificationType: "Rent",
      player: player.name,
    };
  }

  return { success: true };
}

/**
 * Handle the "Pass Go" action which allows the player to draw 2 extra cards
 */
function handlePassGoAction(gameState: GameState, player: Player): void {
  // Draw 2 cards from the deck
  for (let i = 0; i < 2; i++) {
    if (gameState.deck.length > 0) {
      const card = gameState.deck.pop()!;
      player.hand.push(card);
    }
  }
}

export function reassignWildcard(
  gameState: GameState,
  playerId: string,
  cardId: string,
  newColor: string
): boolean {
  // Only the current player can reassign
  if (gameState.players[gameState.currentPlayerIndex].id !== playerId) {
    return false;
  }

  // Only one wild card reassignment per turn
  if (gameState.wildCardReassignedThisTurn) {
    return false;
  }

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return false;

  // Find the card in any property pile
  let foundCard: Card | undefined;
  let oldColor: string | undefined;

  for (const [color, cards] of Object.entries(player.properties)) {
    const cardIndex = cards.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) {
      foundCard = cards[cardIndex];
      oldColor = color;
      // Remove from old color pile
      cards.splice(cardIndex, 1);
      break;
    }
  }

  if (!foundCard || !oldColor || !foundCard.isWildcard) {
    return false;
  }

  // Add to new color pile
  if (!player.properties[newColor]) {
    player.properties[newColor] = [];
  }
  player.properties[newColor].push(foundCard);

  // Mark that we've reassigned a wild card this turn
  gameState.wildCardReassignedThisTurn = true;

  return true;
}

/**
 * Advance to the next player's turn. Also check for winner.
 */
export function endTurn(gameState: GameState) {
  // Check if current player has won
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (checkWinCondition(currentPlayer)) {
    gameState.winnerId = currentPlayer.id;
    return; // game ends
  }

  // Move to next player
  gameState.currentPlayerIndex =
    (gameState.currentPlayerIndex + 1) % gameState.players.length;
  // Start that player's turn
  startTurn(gameState);
}

/**
 * Initialize the game state's pendingAction field
 */
export function initializeGameState(gameState: GameState): void {
  gameState.pendingAction = { type: "NONE" };
}

/**
 * Execute the Sly Deal action: steal a property from another player
 */
export function executePropertySteal(
  gameState: GameState,
  sourcePlayerId: string,
  targetPlayerId: string,
  targetCardId: string
): boolean {
  // First check if target has Just Say No
  const target = gameState.players.find((p) => p.id === targetPlayerId);
  if (!target) return false;

  if (getJustSayNoCard(target)) {
    // Give target player opportunity to use Just Say No
    gameState.pendingAction = {
      type: "JUST_SAY_NO_OPPORTUNITY",
      playerId: targetPlayerId,
      actionType: "SLY_DEAL",
      sourcePlayerId,
      targetCardId,
    };
    return true;
  }

  // Original Sly Deal logic
  if (
    gameState.pendingAction.type !== "SLY_DEAL" ||
    gameState.pendingAction.playerId !== sourcePlayerId
  ) {
    return false;
  }

  const sourcePlayer = gameState.players.find((p) => p.id === sourcePlayerId);
  if (!sourcePlayer || !target) return false;

  // Find the card in target player's properties
  let stolenCard: Card | undefined;
  let cardColor: string | undefined;

  for (const [color, cards] of Object.entries(target.properties)) {
    const cardIndex = cards.findIndex((c) => c.id === targetCardId);
    if (cardIndex !== -1) {
      stolenCard = cards[cardIndex];
      cardColor = color;

      // Don't allow stealing if it would break a complete set
      const requiredSize = getRequiredSetSize(color);
      if (cards.length === requiredSize) {
        return false;
      }

      // Remove from target player's properties
      cards.splice(cardIndex, 1);

      // Clean up empty arrays
      if (cards.length === 0) {
        delete target.properties[color];
      }

      break;
    }
  }

  if (!stolenCard || !cardColor) {
    return false;
  }

  // Add to source player's properties
  if (!sourcePlayer.properties[cardColor]) {
    sourcePlayer.properties[cardColor] = [];
  }
  sourcePlayer.properties[cardColor].push(stolenCard);

  // Reset the pending action
  gameState.pendingAction = { type: "NONE" };

  return true;
}

/**
 * Execute the Deal Breaker action: steal a complete property set from another player
 */
export function executeDealBreaker(
  gameState: GameState,
  sourcePlayerId: string,
  targetPlayerId: string,
  color: string
): boolean {
  const target = gameState.players.find((p) => p.id === targetPlayerId);
  if (!target) return false;

  if (getJustSayNoCard(target)) {
    // Give target player opportunity to use Just Say No
    gameState.pendingAction = {
      type: "JUST_SAY_NO_OPPORTUNITY",
      playerId: targetPlayerId,
      actionType: "DEAL_BREAKER",
      sourcePlayerId,
      color,
    };
    return true;
  }

  // Original Deal Breaker logic
  if (
    gameState.pendingAction.type !== "DEAL_BREAKER" ||
    gameState.pendingAction.playerId !== sourcePlayerId
  ) {
    return false;
  }

  const sourcePlayer = gameState.players.find((p) => p.id === sourcePlayerId);
  if (!sourcePlayer || !target) return false;

  // Get the property set from target player
  const propertySet = target.properties[color];
  if (!propertySet) {
    return false;
  }

  // Check if it's a complete set
  const requiredSize = getRequiredSetSize(color);
  if (propertySet.length < requiredSize) {
    return false;
  }

  // Move all properties from target to source
  if (!sourcePlayer.properties[color]) {
    sourcePlayer.properties[color] = [];
  }
  sourcePlayer.properties[color].push(...propertySet);

  // Remove properties from target player
  delete target.properties[color];

  // Reset the pending action
  gameState.pendingAction = { type: "NONE" };

  return true;
}

/**
 * Handle collecting rent from a player
 */
export function collectRent(
  gameState: GameState,
  targetPlayerId: string,
  paymentCards: string[]
): boolean {
  // Verify that a rent action is pending
  if (gameState.pendingAction.type !== "RENT") {
    return false;
  }

  const { playerId: collectorId, amount } = gameState.pendingAction;
  const collector = gameState.players.find((p) => p.id === collectorId);
  const target = gameState.players.find((p) => p.id === targetPlayerId);

  if (!collector || !target) {
    return false;
  }

  // Calculate total payment value
  let totalPayment = 0;
  const paymentCardsToTransfer: Card[] = [];

  for (const cardId of paymentCards) {
    // Find card in player's hand and money pile
    let card = target.hand.find((c) => c.id === cardId);
    let inHand = true;
    if (!card) {
      card = target.moneyPile.find((c) => c.id === cardId);
      inHand = false;
    }

    if (!card) {
      return false;
    }

    totalPayment += card.value;
    paymentCardsToTransfer.push(card);

    // Remove card from source
    if (inHand) {
      target.hand = target.hand.filter((c) => c.id !== cardId);
    } else {
      target.moneyPile = target.moneyPile.filter((c) => c.id !== cardId);
    }
  }

  // Verify payment amount
  if (totalPayment < amount) {
    // Payment insufficient
    return false;
  }

  // Transfer cards to collector's money pile
  collector.moneyPile.push(...paymentCardsToTransfer);

  // Reset pending action
  gameState.pendingAction = { type: "NONE" };

  return true;
}

export function getJustSayNoCard(player: Player): Card | undefined {
  return player.hand.find((card) => card.name === "Just Say No");
}

function removeFromHand(player: Player, cardId: string) {
  player.hand = player.hand.filter((c) => c.id !== cardId);
}

export function handleJustSayNoResponse(
  gameState: GameState,
  playerId: string,
  useJustSayNo: boolean
): boolean {
  if (gameState.pendingAction.type !== "JUST_SAY_NO_OPPORTUNITY") {
    return false;
  }

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return false;

  if (useJustSayNo) {
    // Check if player has Just Say No card
    const justSayNoCard = getJustSayNoCard(player);
    if (!justSayNoCard) return false;

    // Remove Just Say No from hand and add to discard
    removeFromHand(player, justSayNoCard.id);
    gameState.discardPile.push(justSayNoCard);

    // Cancel the action
    gameState.pendingAction = { type: "NONE" };
    return true;
  }

  // Allow the action to proceed
  const { actionType, sourcePlayerId, targetCardId, color, amount } =
    gameState.pendingAction;

  // Convert the JUST_SAY_NO_OPPORTUNITY back to the original action
  switch (actionType) {
    case "SLY_DEAL":
      if (!targetCardId) return false;
      gameState.pendingAction = {
        type: "SLY_DEAL",
        playerId: sourcePlayerId,
      };
      return executePropertySteal(
        gameState,
        sourcePlayerId,
        playerId,
        targetCardId
      );

    case "DEAL_BREAKER":
      if (!color) return false;
      gameState.pendingAction = {
        type: "DEAL_BREAKER",
        playerId: sourcePlayerId,
      };
      return executeDealBreaker(gameState, sourcePlayerId, playerId, color);

    case "RENT":
      if (!color || amount === undefined) return false;
      gameState.pendingAction = {
        type: "RENT",
        playerId: sourcePlayerId,
        color,
        amount,
      };
      return true;
  }

  return false;
}
