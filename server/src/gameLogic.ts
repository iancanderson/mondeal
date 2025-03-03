import { Card, Player, GameState, ActionCardName, PropertySet } from "./types";
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

  // Initialize empty property sets with houses and hotels set to 0
  for (const player of gameState.players) {
    player.properties = {};
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
    if (player.properties[color].cards.length >= requiredSize) {
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
  const cardsInHand = currentPlayer.hand.length;
  
  // Draw 5 cards if player has none, otherwise draw 2
  const cardsToDraw = cardsInHand === 0 ? 5 : 2;
  
  for (let i = 0; i < cardsToDraw; i++) {
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
function calculateRent(propertySet: PropertySet, color: string): number {
  const count = propertySet.cards.length;
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

  // Get the base rent based on property count
  const rentIndex = Math.min(count, requiredSize) - 1;
  const baseRent = baseRents[color][rentIndex];

  // Calculate total rent including houses and hotels, but don't double for complete sets
  let totalRent = baseRent;
  totalRent += propertySet.houses * 3;
  totalRent += propertySet.hotels * 4;

  return totalRent;
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
    const playerProperties = player.properties[chosenColor];
    if (!playerProperties || playerProperties.cards.length === 0) {
      return { success: false };
    }

    // When played as an action, add to the discard pile
    player.hand.splice(cardIndex, 1);
    gameState.discardPile.push(card);

    // Calculate rent amount for the chosen color
    const rentAmount = calculateRent(playerProperties, chosenColor);

    // Check if any other player has Just Say No
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
      // Set up normal rent action with all other players needing to pay
      gameState.pendingAction = {
        type: "RENT",
        playerId,
        color: chosenColor,
        amount: rentAmount,
        remainingPayers: otherPlayers.map((p) => p.id),
      };
    }

    gameState.cardsPlayedThisTurn++;
    return { success: true, notificationType: "Rent", player: player.name };
  }

  // For House/Hotel cards, validate that they are played as action and target color is valid
  if ((card.name === "House" || card.name === "Hotel") && playAsAction) {
    if (!chosenColor) return { success: false };

    const propertySet = player.properties[chosenColor];
    if (!propertySet) return { success: false };

    // Ensure property set is complete
    const requiredSize = getRequiredSetSize(chosenColor);
    if (propertySet.cards.length < requiredSize) return { success: false };

    // Remove card from hand and add to discard pile
    player.hand.splice(cardIndex, 1);
    gameState.discardPile.push(card);

    // Update the property set's house/hotel count
    if (card.name === "House") {
      propertySet.houses++;
    } else {
      propertySet.hotels++;
    }

    gameState.cardsPlayedThisTurn++;

    // Reset pending action to ensure turn can pass
    gameState.pendingAction = { type: "NONE" };

    // Automatically end turn if this was the player's third card
    if (gameState.cardsPlayedThisTurn >= 3) {
      endTurn(gameState);
    }

    // Send notification about the upgrade
    const newRent = calculateRent(propertySet, chosenColor);
    const notification = `${
      player.name
    } added a ${card.name.toLowerCase()} to their ${chosenColor} set (Rent is now $${newRent}M)`;
    return { success: true, notificationType: card.name, player: notification };
  }

  // Remove from player's hand
  player.hand.splice(cardIndex, 1);

  // For property cards being played to a color set
  if (card.type === "PROPERTY") {
    const propertyColor = card.isWildcard ? chosenColor! : card.color!;
    // Initialize property set if it doesn't exist
    if (!player.properties[propertyColor]) {
      player.properties[propertyColor] = {
        cards: [],
        houses: 0,
        hotels: 0,
      };
    }
    player.properties[propertyColor].cards.push(card);
  } else if (card.type === "RENT" && playAsAction && chosenColor) {
    // When played as an action, add to the discard pile
    gameState.discardPile.push(card);

    // Calculate rent amount for the chosen color
    const propertySet = player.properties[chosenColor];
    if (!propertySet || propertySet.cards.length === 0)
      return { success: false };

    const rentAmount = calculateRent(propertySet, chosenColor);

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
        remainingPayers: otherPlayers.map((p) => p.id),
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
      case "Forced Deal":
        // Set up pending action for Forced Deal
        gameState.pendingAction = {
          type: "FORCED_DEAL",
          playerId: playerId,
        };
        break;
      case "Debt Collector":
        // Set up pending action for Debt Collector - fixed $5M fee
        gameState.pendingAction = {
          type: "DEBT_COLLECTOR",
          playerId: playerId,
          amount: 5, // $5M is the standard debt collection fee
        };
        break;
      case "It's My Birthday":
        // Set up pending action for It's My Birthday - each player pays $2M
        gameState.pendingAction = {
          type: "BIRTHDAY",
          playerId: playerId,
          amount: 2, // $2M is the standard birthday gift amount
          remainingPayers: gameState.players
            .filter((p) => p.id !== playerId) // Everyone except the birthday person
            .map((p) => p.id),
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

  for (const [color, propertySet] of Object.entries(player.properties)) {
    const cardIndex = propertySet.cards.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) {
      foundCard = propertySet.cards[cardIndex];
      oldColor = color;
      // Remove from old color pile
      propertySet.cards.splice(cardIndex, 1);
      if (propertySet.cards.length === 0) {
        delete player.properties[color];
      }
      break;
    }
  }

  if (!foundCard || !oldColor || !foundCard.isWildcard) {
    return false;
  }

  // Add to new color pile
  if (!player.properties[newColor]) {
    player.properties[newColor] = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
  }
  player.properties[newColor].cards.push(foundCard);

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

  for (const [color, propertySet] of Object.entries(target.properties)) {
    const cardIndex = propertySet.cards.findIndex((c) => c.id === targetCardId);
    if (cardIndex !== -1) {
      stolenCard = propertySet.cards[cardIndex];
      cardColor = color;

      // Don't allow stealing if it would break a complete set
      const requiredSize = getRequiredSetSize(color);
      if (propertySet.cards.length === requiredSize) {
        return false;
      }

      // Remove from target player's properties
      propertySet.cards.splice(cardIndex, 1);
      if (propertySet.cards.length === 0) {
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
    sourcePlayer.properties[cardColor] = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
  }
  sourcePlayer.properties[cardColor].cards.push(stolenCard);

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
  if (propertySet.cards.length < requiredSize) {
    return false;
  }

  // Move all properties from target to source
  if (!sourcePlayer.properties[color]) {
    sourcePlayer.properties[color] = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
  }
  sourcePlayer.properties[color].cards.push(...propertySet.cards);
  sourcePlayer.properties[color].houses = propertySet.houses;
  sourcePlayer.properties[color].hotels = propertySet.hotels;

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

  const {
    playerId: collectorId,
    amount,
    remainingPayers,
  } = gameState.pendingAction;

  // Verify this player needs to pay
  if (!remainingPayers.includes(targetPlayerId)) {
    return false;
  }

  const collector = gameState.players.find((p) => p.id === collectorId);
  const target = gameState.players.find((p) => p.id === targetPlayerId);

  if (!collector || !target) {
    return false;
  }

  // Get all possible payment sources
  const moneyPileCards = target.moneyPile;
  const propertyCards = Object.values(target.properties).flatMap(
    (set) => set.cards
  );
  const availableCards = [...moneyPileCards, ...propertyCards];

  // Calculate total possible payment
  const totalPossible = availableCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  // Check if this is a bankruptcy case (insufficient total funds)
  const isBankruptcy = totalPossible < amount;

  // In bankruptcy case, validate that ALL cards are being surrendered
  if (isBankruptcy && paymentCards.length !== availableCards.length) {
    return false;
  }

  // Validate all payment cards exist in allowed sources
  for (const cardId of paymentCards) {
    const cardExists = availableCards.some((c) => c.id === cardId);
    if (!cardExists) {
      return false;
    }
  }

  // Transfer the selected cards
  const paymentCardsToTransfer: Card[] = [];
  for (const cardId of paymentCards) {
    // Look for the card in money pile first
    let card = target.moneyPile.find((c) => c.id === cardId);
    let location: "money" | "property" = "money";

    if (!card) {
      // Look in properties
      for (const [color, propertySet] of Object.entries(target.properties)) {
        const foundCard = propertySet.cards.find((c) => c.id === cardId);
        if (foundCard) {
          card = foundCard;
          location = "property";
          break;
        }
      }
    }

    if (!card) {
      return false;
    }

    paymentCardsToTransfer.push(card);

    // Remove card from its source
    switch (location) {
      case "money":
        target.moneyPile = target.moneyPile.filter((c) => c.id !== cardId);
        break;
      case "property":
        // Remove from the appropriate property color set
        for (const [color, propertySet] of Object.entries(target.properties)) {
          const cardIndex = propertySet.cards.findIndex((c) => c.id === cardId);
          if (cardIndex !== -1) {
            propertySet.cards.splice(cardIndex, 1);
            // Clean up empty property arrays
            if (propertySet.cards.length === 0) {
              delete target.properties[color];
            }
            break;
          }
        }
        break;
    }
  }

  // For non-bankruptcy case, verify payment amount
  if (
    !isBankruptcy &&
    paymentCardsToTransfer.reduce((sum, card) => sum + card.value, 0) < amount
  ) {
    return false;
  }

  // Sort cards: properties go to collector's properties, others to money pile
  for (const card of paymentCardsToTransfer) {
    if (card.type === "PROPERTY") {
      // Add to collector's properties
      const color = card.isWildcard
        ? Object.keys(collector.properties)[0] || "Brown"
        : card.color!;
      if (!collector.properties[color]) {
        collector.properties[color] = {
          cards: [],
          houses: 0,
          hotels: 0,
        };
      }
      collector.properties[color].cards.push(card);
    } else {
      // Add to collector's money pile
      collector.moneyPile.push(card);
    }
  }

  // Remove this player from the remaining payers list
  gameState.pendingAction = {
    ...gameState.pendingAction,
    remainingPayers: remainingPayers.filter((id) => id !== targetPlayerId),
  };

  // Only reset the pending action when all players have paid
  if (gameState.pendingAction.remainingPayers.length === 0) {
    gameState.pendingAction = { type: "NONE" };

    // Check if this was the 3rd card played and end turn if so
    if (gameState.cardsPlayedThisTurn >= 3) {
      endTurn(gameState);
    }
  }

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

    // Check if the current player's turn should end
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (gameState.cardsPlayedThisTurn >= 3) {
      endTurn(gameState);
    }

    return true;
  }

  // Allow the action to proceed
  const { actionType, sourcePlayerId, targetCardId, color, amount, myCardId } =
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
      // When a player allows rent to be charged, set up the rent collection with remaining payers
      gameState.pendingAction = {
        type: "RENT",
        playerId: sourcePlayerId,
        color,
        amount,
        remainingPayers: gameState.players
          .filter((p) => p.id !== sourcePlayerId) // Everyone except the rent collector
          .map((p) => p.id),
      };
      return true;

    case "FORCED_DEAL":
      if (!targetCardId || !myCardId) return false;
      gameState.pendingAction = {
        type: "FORCED_DEAL",
        playerId: sourcePlayerId,
      };
      return executeForcedDeal(
        gameState,
        sourcePlayerId,
        playerId,
        targetCardId,
        myCardId
      );

    case "DEBT_COLLECTOR":
      if (amount === undefined) return false;
      gameState.pendingAction = {
        type: "DEBT_COLLECTOR",
        playerId: sourcePlayerId,
        amount,
      };
      return true;
  }

  return false;
}

/**
 * Execute a Forced Deal action: trade a property from another player
 */
export function executeForcedDeal(
  gameState: GameState,
  sourcePlayerId: string,
  targetPlayerId: string,
  targetCardId: string,
  myCardId: string
): boolean {
  // First check if target has Just Say No
  const target = gameState.players.find((p) => p.id === targetPlayerId);
  if (!target) return false;

  if (getJustSayNoCard(target)) {
    // Give target player opportunity to use Just Say No
    gameState.pendingAction = {
      type: "JUST_SAY_NO_OPPORTUNITY",
      playerId: targetPlayerId,
      actionType: "FORCED_DEAL",
      sourcePlayerId,
      targetCardId,
      myCardId,
    };
    return true;
  }

  // Make sure the gameState has a FORCED_DEAL pending action
  if (
    gameState.pendingAction.type !== "FORCED_DEAL" &&
    gameState.pendingAction.type !== "NONE"
  ) {
    return false;
  }

  const sourcePlayer = gameState.players.find((p) => p.id === sourcePlayerId);
  if (!sourcePlayer || !target) return false;

  // Find the card in target player's properties
  let theirCard: Card | undefined;
  let theirColor: string | undefined;

  for (const [color, propertySet] of Object.entries(target.properties)) {
    const cardIndex = propertySet.cards.findIndex((c) => c.id === targetCardId);
    if (cardIndex !== -1) {
      theirCard = propertySet.cards[cardIndex];
      theirColor = color;

      // Don't allow stealing if it would break a complete set
      const requiredSize = getRequiredSetSize(color);
      if (propertySet.cards.length === requiredSize) {
        return false;
      }

      // Remove from target player's properties
      propertySet.cards.splice(cardIndex, 1);
      if (propertySet.cards.length === 0) {
        delete target.properties[color];
      }
      break;
    }
  }

  if (!theirCard || !theirColor) {
    return false;
  }

  // Find the card in source player's properties
  let myCard: Card | undefined;
  let myColor: string | undefined;

  for (const [color, propertySet] of Object.entries(sourcePlayer.properties)) {
    const cardIndex = propertySet.cards.findIndex((c) => c.id === myCardId);
    if (cardIndex !== -1) {
      myCard = propertySet.cards[cardIndex];
      myColor = color;

      // Remove from source player's properties
      propertySet.cards.splice(cardIndex, 1);
      if (propertySet.cards.length === 0) {
        delete sourcePlayer.properties[color];
      }
      break;
    }
  }

  if (!myCard || !myColor) {
    return false;
  }

  // Add target's card to source player's properties
  if (!sourcePlayer.properties[theirColor]) {
    sourcePlayer.properties[theirColor] = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
  }
  sourcePlayer.properties[theirColor].cards.push(theirCard);

  // Add source's card to target player's properties
  if (!target.properties[myColor]) {
    target.properties[myColor] = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
  }
  target.properties[myColor].cards.push(myCard);

  // Reset the pending action
  gameState.pendingAction = { type: "NONE" };

  // Check if this was the 3rd card played and end turn if so
  if (gameState.cardsPlayedThisTurn >= 3) {
    endTurn(gameState);
  }

  return true;
}

/**
 * Handle collecting debt from a player (Debt Collector action)
 */
export function collectDebt(
  gameState: GameState,
  sourcePlayerId: string,
  targetPlayerId: string,
  paymentCards: string[]
): boolean {
  // Verify that a debt collector action is pending
  if (gameState.pendingAction.type !== "DEBT_COLLECTOR") {
    return false;
  }

  if (gameState.pendingAction.playerId !== sourcePlayerId) {
    return false;
  }

  const { amount } = gameState.pendingAction;
  const collector = gameState.players.find((p) => p.id === sourcePlayerId);
  const target = gameState.players.find((p) => p.id === targetPlayerId);

  if (!collector || !target) {
    return false;
  }

  // First check if target has Just Say No
  if (getJustSayNoCard(target)) {
    // Give target player opportunity to use Just Say No
    gameState.pendingAction = {
      type: "JUST_SAY_NO_OPPORTUNITY",
      playerId: targetPlayerId,
      actionType: "DEBT_COLLECTOR",
      sourcePlayerId,
      amount: amount,
    };
    return true;
  }

  // Get all possible payment sources
  const moneyPileCards = target.moneyPile;
  const propertyCards = Object.values(target.properties).flatMap(
    (set) => set.cards
  );
  const availableCards = [...moneyPileCards, ...propertyCards];

  // Calculate total possible payment
  const totalPossible = availableCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  // Check if this is a bankruptcy case (insufficient total funds)
  const isBankruptcy = totalPossible < amount;

  // In bankruptcy case, validate that ALL cards are being surrendered
  if (isBankruptcy && paymentCards.length !== availableCards.length) {
    return false;
  }

  // Validate all payment cards exist in allowed sources (money pile or properties)
  for (const cardId of paymentCards) {
    const cardExists = availableCards.some((c) => c.id === cardId);
    if (!cardExists) {
      return false;
    }
  }

  // Transfer the selected cards
  const paymentCardsToTransfer: Card[] = [];
  for (const cardId of paymentCards) {
    // Look for the card in money pile first
    let card = target.moneyPile.find((c) => c.id === cardId);
    let location: "money" | "property" = "money";

    if (!card) {
      // Look in properties
      for (const [color, propertySet] of Object.entries(target.properties)) {
        const foundCard = propertySet.cards.find((c) => c.id === cardId);
        if (foundCard) {
          card = foundCard;
          location = "property";
          break;
        }
      }
    }

    if (!card) {
      return false;
    }

    paymentCardsToTransfer.push(card);

    // Remove card from its source
    switch (location) {
      case "money":
        target.moneyPile = target.moneyPile.filter((c) => c.id !== cardId);
        break;
      case "property":
        // Remove from the appropriate property color set
        for (const [color, propertySet] of Object.entries(target.properties)) {
          const cardIndex = propertySet.cards.findIndex((c) => c.id === cardId);
          if (cardIndex !== -1) {
            propertySet.cards.splice(cardIndex, 1);
            // Clean up empty property arrays
            if (propertySet.cards.length === 0) {
              delete target.properties[color];
            }
            break;
          }
        }
        break;
    }
  }

  // For non-bankruptcy case, verify payment amount
  if (
    !isBankruptcy &&
    paymentCardsToTransfer.reduce((sum, card) => sum + card.value, 0) < amount
  ) {
    return false;
  }

  // Sort cards: properties go to collector's properties, others to money pile
  for (const card of paymentCardsToTransfer) {
    if (card.type === "PROPERTY") {
      // Add to collector's properties
      const color = card.isWildcard
        ? Object.keys(collector.properties)[0] || "Brown"
        : card.color!;
      if (!collector.properties[color]) {
        collector.properties[color] = {
          cards: [],
          houses: 0,
          hotels: 0,
        };
      }
      collector.properties[color].cards.push(card);
    } else {
      // Add to collector's money pile
      collector.moneyPile.push(card);
    }
  }

  // Reset pending action
  gameState.pendingAction = { type: "NONE" };

  // Check if this was the 3rd card played and end turn if so
  if (gameState.cardsPlayedThisTurn >= 3) {
    endTurn(gameState);
  }

  return true;
}

/**
 * Handle collecting birthday payment from a player
 */
export function collectBirthdayPayment(
  gameState: GameState,
  targetPlayerId: string,
  paymentCards: string[]
): boolean {
  // Verify that a birthday action is pending
  if (gameState.pendingAction.type !== "BIRTHDAY") {
    return false;
  }

  const {
    playerId: birthdayPersonId,
    amount,
    remainingPayers,
  } = gameState.pendingAction;

  // Verify this player needs to pay
  if (!remainingPayers.includes(targetPlayerId)) {
    return false;
  }

  const birthdayPerson = gameState.players.find(
    (p) => p.id === birthdayPersonId
  );
  const target = gameState.players.find((p) => p.id === targetPlayerId);

  if (!birthdayPerson || !target) {
    return false;
  }

  // First check if target has Just Say No
  if (getJustSayNoCard(target)) {
    // Give target player opportunity to use Just Say No
    gameState.pendingAction = {
      type: "JUST_SAY_NO_OPPORTUNITY",
      playerId: targetPlayerId,
      actionType: "BIRTHDAY",
      sourcePlayerId: birthdayPersonId,
      amount: amount,
    };
    return true;
  }

  // Get all possible payment sources
  const moneyPileCards = target.moneyPile;
  const propertyCards = Object.values(target.properties).flatMap(
    (set) => set.cards
  );
  const availableCards = [...moneyPileCards, ...propertyCards];

  // Calculate total possible payment
  const totalPossible = availableCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  // Check if this is a bankruptcy case (insufficient total funds)
  const isBankruptcy = totalPossible < amount;

  // In bankruptcy case, validate that ALL cards are being surrendered
  if (isBankruptcy && paymentCards.length !== availableCards.length) {
    return false;
  }

  // Validate all payment cards exist in allowed sources
  for (const cardId of paymentCards) {
    const cardExists = availableCards.some((c) => c.id === cardId);
    if (!cardExists) {
      return false;
    }
  }

  // Transfer the selected cards
  const paymentCardsToTransfer: Card[] = [];
  for (const cardId of paymentCards) {
    // Look for the card in money pile first
    let card = target.moneyPile.find((c) => c.id === cardId);
    let location: "money" | "property" = "money";

    if (!card) {
      // Look in properties
      for (const [color, propertySet] of Object.entries(target.properties)) {
        const foundCard = propertySet.cards.find((c) => c.id === cardId);
        if (foundCard) {
          card = foundCard;
          location = "property";
          break;
        }
      }
    }

    if (!card) {
      return false;
    }

    paymentCardsToTransfer.push(card);

    // Remove card from its source
    switch (location) {
      case "money":
        target.moneyPile = target.moneyPile.filter((c) => c.id !== cardId);
        break;
      case "property":
        // Remove from the appropriate property color set
        for (const [color, propertySet] of Object.entries(target.properties)) {
          const cardIndex = propertySet.cards.findIndex((c) => c.id === cardId);
          if (cardIndex !== -1) {
            propertySet.cards.splice(cardIndex, 1);
            // Clean up empty property arrays
            if (propertySet.cards.length === 0) {
              delete target.properties[color];
            }
            break;
          }
        }
        break;
    }
  }

  // For non-bankruptcy case, verify payment amount
  if (
    !isBankruptcy &&
    paymentCardsToTransfer.reduce((sum, card) => sum + card.value, 0) < amount
  ) {
    return false;
  }

  // Sort cards: properties go to birthday person's properties, others to money pile
  for (const card of paymentCardsToTransfer) {
    if (card.type === "PROPERTY") {
      // Add to birthday person's properties
      const color = card.isWildcard
        ? Object.keys(birthdayPerson.properties)[0] || "Brown"
        : card.color!;
      if (!birthdayPerson.properties[color]) {
        birthdayPerson.properties[color] = {
          cards: [],
          houses: 0,
          hotels: 0,
        };
      }
      birthdayPerson.properties[color].cards.push(card);
    } else {
      // Add to birthday person's money pile
      birthdayPerson.moneyPile.push(card);
    }
  }

  // Remove this player from the remaining payers list
  gameState.pendingAction = {
    ...gameState.pendingAction,
    remainingPayers: remainingPayers.filter((id) => id !== targetPlayerId),
  };

  // Only reset the pending action when all players have paid
  if (gameState.pendingAction.remainingPayers.length === 0) {
    gameState.pendingAction = { type: "NONE" };

    // Check if this was the 3rd card played and end turn if so
    if (gameState.cardsPlayedThisTurn >= 3) {
      endTurn(gameState);
    }
  }

  return true;
}
