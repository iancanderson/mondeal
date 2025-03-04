import {
  Card,
  Player,
  GameState,
  ActionCardName,
  PropertySet,
  PropertyColor,
  CardType,
  PropertyCard,
  getRequiredSetSize,
} from "./types";
import { v4 as uuidv4 } from "uuid";

/**
 * Create an initial deck of simplified Monopoly Deal cards.
 * Adjust as needed for more realistic or complete sets.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  // Property cards with real Monopoly colors and names
  const properties = {
    [PropertyColor.BROWN]: ["Mediterranean Avenue", "Baltic Avenue"],
    [PropertyColor.BLUE]: ["Boardwalk", "Park Place"],
    [PropertyColor.GREEN]: [
      "Pacific Avenue",
      "North Carolina Avenue",
      "Pennsylvania Avenue",
    ],
    [PropertyColor.YELLOW]: [
      "Atlantic Avenue",
      "Ventnor Avenue",
      "Marvin Gardens",
    ],
    [PropertyColor.RED]: [
      "Kentucky Avenue",
      "Indiana Avenue",
      "Illinois Avenue",
    ],
    [PropertyColor.ORANGE]: [
      "St. James Place",
      "Tennessee Avenue",
      "New York Avenue",
    ],
    [PropertyColor.PURPLE]: [
      "St. Charles Place",
      "Virginia Avenue",
      "States Avenue",
    ],
    [PropertyColor.LIGHT_BLUE]: [
      "Connecticut Avenue",
      "Vermont Avenue",
      "Oriental Avenue",
    ],
    [PropertyColor.RAILROAD]: [
      "Reading Railroad",
      "Pennsylvania Railroad",
      "B&O Railroad",
      "Short Line",
    ],
    [PropertyColor.UTILITY]: ["Electric Company", "Water Works"],
  };

  // Add property cards
  Object.entries(properties).forEach(([color, propertyNames]) => {
    propertyNames.forEach((name) => {
      deck.push({
        id: uuidv4(),
        name,
        type: CardType.PROPERTY,
        value:
          color === PropertyColor.RAILROAD || color === PropertyColor.UTILITY
            ? 2
            : 3,
        color: color as PropertyColor,
      });
    });
  });

  // Add rent cards with proper PropertyColor enum values
  const rentGroups = [
    { colors: [PropertyColor.BROWN, PropertyColor.LIGHT_BLUE], count: 2 },
    { colors: [PropertyColor.PURPLE, PropertyColor.ORANGE], count: 2 },
    { colors: [PropertyColor.RED, PropertyColor.YELLOW], count: 2 },
    { colors: [PropertyColor.GREEN, PropertyColor.BLUE], count: 2 },
    { colors: [PropertyColor.RAILROAD, PropertyColor.UTILITY], count: 2 },
  ];

  rentGroups.forEach(({ colors, count }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: uuidv4(),
        name: `${colors.join("/")} Rent`,
        type: CardType.RENT,
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
      type: CardType.PROPERTY,
      value: 4,
      color: PropertyColor.BROWN, // Default color, will be changed when played
      isWildcard: true,
    });
  });

  // Add money cards with real values
  const moneyValues = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5];
  moneyValues.forEach((value) => {
    deck.push({
      id: uuidv4(),
      name: `$${value}M`,
      type: CardType.MONEY,
      value,
    });
  });

  // Add action cards with real names
  const actionCards: ActionCardName[] = [
    ActionCardName.DEAL_BREAKER,
    ActionCardName.JUST_SAY_NO,
    ActionCardName.SLY_DEAL,
    ActionCardName.FORCED_DEAL,
    ActionCardName.DEBT_COLLECTOR,
    ActionCardName.ITS_MY_BIRTHDAY,
    ActionCardName.DOUBLE_THE_RENT,
    ActionCardName.HOUSE,
    ActionCardName.HOTEL,
    ActionCardName.PASS_GO,
  ];

  actionCards.forEach((name) => {
    deck.push({
      id: uuidv4(),
      name,
      type: CardType.ACTION,
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

export function getCompletedSetCount(player: Player): number {
  let completedSets = 0;

  for (const color in player.properties) {
    // For each color, check each set
    const propertySets = player.properties[color];
    if (!propertySets) continue;

    const requiredSize = getRequiredSetSize(color as PropertyColor);

    // Count how many complete sets this color has
    for (const set of propertySets) {
      if (set.cards.length >= requiredSize) {
        completedSets++;
      }
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
}

/**
 * Calculate rent for a property color, with optional doubling
 */
function calculateRent(
  propertySet: PropertySet,
  color: PropertyColor,
  isDoubled: boolean = false
): number {
  const count = propertySet.cards.length;
  const requiredSize = getRequiredSetSize(color);
  const isComplete = count >= requiredSize;

  // Base rent values for each color
  const baseRents: Record<PropertyColor, number[]> = {
    [PropertyColor.BROWN]: [1, 2],
    [PropertyColor.LIGHT_BLUE]: [1, 2, 3],
    [PropertyColor.PURPLE]: [1, 2, 4],
    [PropertyColor.ORANGE]: [1, 3, 5],
    [PropertyColor.RED]: [2, 3, 6],
    [PropertyColor.YELLOW]: [2, 4, 6],
    [PropertyColor.GREEN]: [2, 4, 7],
    [PropertyColor.BLUE]: [3, 8],
    [PropertyColor.RAILROAD]: [1, 2, 3, 4],
    [PropertyColor.UTILITY]: [1, 2],
  };

  // Get the base rent based on property count
  const rentIndex = Math.min(count, requiredSize) - 1;
  const baseRent = baseRents[color][rentIndex];

  // Calculate total rent including houses and hotels
  let totalRent = baseRent;
  totalRent += propertySet.houses * 3;
  totalRent += propertySet.hotels * 4;

  // Double the rent if specified
  return isDoubled ? totalRent * 2 : totalRent;
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
  if (card.type === CardType.PROPERTY && card.isWildcard && !chosenColor) {
    return { success: false };
  }

  // For rent cards played as action, validate:
  // 1. We need a chosen color from their available colors
  // 2. Player must own at least one property of that color
  if (card.type === CardType.RENT && playAsAction) {
    if (
      !chosenColor ||
      !card.rentColors?.includes(chosenColor as PropertyColor)
    ) {
      return { success: false };
    }

    // Check if player owns any properties of the chosen color
    const propertySets = player.properties[chosenColor];
    if (!propertySets || propertySets.length === 0) {
      return { success: false };
    }

    // Use the first set for rent calculation
    const propertySet = propertySets[0];

    // Remove card from hand and add to discard
    player.hand.splice(cardIndex, 1);
    gameState.discardPile.push(card);

    // Check if this is following a Double The Rent action
    const isDoubleRent = gameState.pendingAction.type === "DOUBLE_RENT_PENDING";
    const rentAmount = calculateRent(propertySet, chosenColor as PropertyColor, isDoubleRent);

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
      // Set up normal rent action
      gameState.pendingAction = {
        type: "RENT",
        playerId,
        color: chosenColor,
        amount: rentAmount,
        remainingPayers: otherPlayers.map((p) => p.id),
        isDoubled: isDoubleRent,
      };
    }

    gameState.cardsPlayedThisTurn++;
    const notification = `${player.name} charges ${
      isDoubleRent ? "DOUBLE " : ""
    }rent for ${chosenColor} properties ($${rentAmount}M)`;
    return {
      success: true,
      notificationType: ActionCardName.RENT,
      player: notification,
    };
  }

  // For House/Hotel cards, validate that they are played as action and target color is valid
  if (
    (card.name === ActionCardName.HOUSE ||
      card.name === ActionCardName.HOTEL) &&
    playAsAction
  ) {
    if (!chosenColor) return { success: false };

    const propertySets = player.properties[chosenColor];
    if (!propertySets || propertySets.length === 0) return { success: false };

    // Find a complete set to add house/hotel to
    const requiredSize = getRequiredSetSize(chosenColor as PropertyColor);
    let completeSetIndex = -1;

    for (let i = 0; i < propertySets.length; i++) {
      if (propertySets[i].cards.length >= requiredSize) {
        completeSetIndex = i;
        break;
      }
    }

    if (completeSetIndex === -1) return { success: false };

    const propertySet = propertySets[completeSetIndex];

    // Remove card from hand and add to discard pile
    player.hand.splice(cardIndex, 1);
    gameState.discardPile.push(card);

    // Update the property set's house/hotel count
    if (card.name === ActionCardName.HOUSE) {
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
    const newRent = calculateRent(propertySet, chosenColor as PropertyColor);
    const notification = `${
      player.name
    } added a ${card.name.toLowerCase()} to their ${chosenColor} set (Rent is now $${newRent}M)`;
    return { success: true, notificationType: card.name, player: notification };
  }

  // Handle Double The Rent action
  if (card.name === ActionCardName.DOUBLE_THE_RENT && playAsAction) {
    // Remove from player's hand and add to discard pile
    player.hand.splice(cardIndex, 1);
    gameState.discardPile.push(card);

    // Set up pending action for Double Rent
    gameState.pendingAction = {
      type: "DOUBLE_RENT_PENDING",
      playerId: playerId,
    };

    gameState.cardsPlayedThisTurn++;
    return {
      success: true,
      notificationType: ActionCardName.DOUBLE_THE_RENT,
      player: player.name,
    };
  }

  // Remove from player's hand
  player.hand.splice(cardIndex, 1);

  // For property cards being played to a color set
  if (card.type === CardType.PROPERTY) {
    const propertyColor = card.isWildcard ? chosenColor! : card.color!;

    // Initialize property set array if it doesn't exist
    if (!player.properties[propertyColor]) {
      player.properties[propertyColor] = [
        {
          cards: [],
          houses: 0,
          hotels: 0,
        },
      ];
    }

    // Get the required set size for this color
    const requiredSetSize = getRequiredSetSize(propertyColor as PropertyColor);

    // Find an incomplete set or create a new one if all sets are complete
    let targetSet: PropertySet | undefined;

    // First, try to find an incomplete set
    for (const set of player.properties[propertyColor]) {
      if (set.cards.length < requiredSetSize) {
        targetSet = set;
        break;
      }
    }

    // If no incomplete set found, create a new set
    if (!targetSet) {
      const newSet: PropertySet = {
        cards: [],
        houses: 0,
        hotels: 0,
      };
      player.properties[propertyColor].push(newSet);
      targetSet = newSet;
    }

    // Add the card to the target set
    targetSet.cards.push(card);
  } else if (card.type === CardType.ACTION && playAsAction) {
    // When played as an action, add to the discard pile
    gameState.discardPile.push(card);

    // Handle specific action card effects using the typed name
    switch (card.name as ActionCardName) {
      case ActionCardName.PASS_GO:
        handlePassGoAction(gameState, player);
        break;
      case ActionCardName.SLY_DEAL:
        // Set up pending action for Sly Deal
        gameState.pendingAction = {
          type: "SLY_DEAL",
          playerId: playerId,
        };
        break;
      case ActionCardName.DEAL_BREAKER:
        // Set up pending action for Deal Breaker
        gameState.pendingAction = {
          type: "DEAL_BREAKER",
          playerId: playerId,
        };
        break;
      case ActionCardName.FORCED_DEAL:
        // Set up pending action for Forced Deal
        gameState.pendingAction = {
          type: "FORCED_DEAL",
          playerId: playerId,
        };
        break;
      case ActionCardName.DEBT_COLLECTOR:
        // Set up pending action for Debt Collector - fixed $5M fee
        gameState.pendingAction = {
          type: "DEBT_COLLECTOR",
          playerId: playerId,
          amount: 5, // $5M is the standard debt collection fee
        };
        break;
      case ActionCardName.ITS_MY_BIRTHDAY:
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
  if (card.type === CardType.ACTION && playAsAction) {
    return {
      success: true,
      notificationType: card.name as ActionCardName,
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
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return false;

  // Find the card in any property pile
  let foundPropertyCard: PropertyCard | undefined;
  let oldColor: PropertyColor | undefined;
  let oldSetIndex: number = -1;

  outer: for (const [color, propertySets] of Object.entries(
    player.properties
  )) {
    for (let setIndex = 0; setIndex < propertySets.length; setIndex++) {
      const set = propertySets[setIndex];
      const cardIndex = set.cards.findIndex((c) => c.id === cardId);
      if (cardIndex !== -1) {
        const card = set.cards[cardIndex];
        if (card.type === CardType.PROPERTY && card.isWildcard) {
          foundPropertyCard = card;
          oldColor = color as PropertyColor;
          oldSetIndex = setIndex;

          // Remove from old color pile
          set.cards.splice(cardIndex, 1);

          // If set is now empty, remove it
          if (set.cards.length === 0) {
            propertySets.splice(setIndex, 1);

            // If no more sets for this color, remove the color entry
            if (propertySets.length === 0) {
              delete player.properties[color];
            }
          }
          break outer;
        }
      }
    }
  }

  if (!foundPropertyCard || !oldColor) {
    return false;
  }

  // Add to new color pile
  if (!player.properties[newColor]) {
    player.properties[newColor] = [
      {
        cards: [],
        houses: 0,
        hotels: 0,
      },
    ];
  }

  // Find an incomplete set to add the wildcard to
  const requiredSetSize = getRequiredSetSize(newColor as PropertyColor);
  let targetSet: PropertySet | undefined;

  // First try to find an incomplete set
  for (const set of player.properties[newColor]) {
    if (set.cards.length < requiredSetSize) {
      targetSet = set;
      break;
    }
  }

  // If no incomplete set found, create a new one
  if (!targetSet) {
    const newSet: PropertySet = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
    player.properties[newColor].push(newSet);
    targetSet = newSet;
  }

  // Add the wildcard to the target set
  targetSet.cards.push(foundPropertyCard);

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

  // Check if current player needs to discard
  if (currentPlayer.hand.length > 7) {
    gameState.pendingAction = {
      type: "DISCARD_NEEDED",
      playerId: currentPlayer.id,
    };
    return;
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
  let setIndex: number = -1;

  // Look through all property sets of all colors
  outer: for (const [color, propertySets] of Object.entries(
    target.properties
  )) {
    for (let i = 0; i < propertySets.length; i++) {
      const set = propertySets[i];
      const cardIndex = set.cards.findIndex((c) => c.id === targetCardId);

      if (cardIndex !== -1) {
        stolenCard = set.cards[cardIndex];
        cardColor = color;
        setIndex = i;

        // Don't allow stealing if it would break a complete set
        const requiredSize = getRequiredSetSize(color as PropertyColor);
        if (set.cards.length === requiredSize) {
          return false;
        }

        // Remove from target player's properties
        set.cards.splice(cardIndex, 1);

        // If set is now empty, remove it
        if (set.cards.length === 0) {
          propertySets.splice(i, 1);

          // If no more sets for this color, remove the color entry
          if (propertySets.length === 0) {
            delete target.properties[color];
          }
        }
        break outer;
      }
    }
  }

  if (!stolenCard || !cardColor) {
    return false;
  }

  // Add to source player's properties
  if (!sourcePlayer.properties[cardColor]) {
    sourcePlayer.properties[cardColor] = [
      {
        cards: [],
        houses: 0,
        hotels: 0,
      },
    ];
  }

  // Find an incomplete set to add the property to
  const requiredSetSize = getRequiredSetSize(cardColor as PropertyColor);
  let targetSet = sourcePlayer.properties[cardColor][0]; // Default to first set

  // Try to find an incomplete set
  for (const set of sourcePlayer.properties[cardColor]) {
    if (set.cards.length < requiredSetSize) {
      targetSet = set;
      break;
    }
  }

  // If all sets are complete, create a new set
  if (targetSet.cards.length >= requiredSetSize) {
    const newSet = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
    sourcePlayer.properties[cardColor].push(newSet);
    targetSet = newSet;
  }

  targetSet.cards.push(stolenCard);

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
  color: PropertyColor
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

  // Get the property sets from target player
  const propertySets = target.properties[color];
  if (!propertySets || propertySets.length === 0) {
    return false;
  }

  // Find a complete set to steal
  const requiredSize = getRequiredSetSize(color);
  let completeSetIndex = -1;

  for (let i = 0; i < propertySets.length; i++) {
    if (propertySets[i].cards.length >= requiredSize) {
      completeSetIndex = i;
      break;
    }
  }

  if (completeSetIndex === -1) {
    return false; // No complete set found
  }

  const completeSet = propertySets[completeSetIndex];

  // Initialize source player's property sets for this color if needed
  if (!sourcePlayer.properties[color]) {
    sourcePlayer.properties[color] = [];
  }

  // Add a new set to the source player with the stolen set's properties
  sourcePlayer.properties[color].push({
    cards: [...completeSet.cards],
    houses: completeSet.houses,
    hotels: completeSet.hotels,
  });

  // Remove the stolen set from the target player
  propertySets.splice(completeSetIndex, 1);

  // If no more sets for this color, remove the color entry
  if (propertySets.length === 0) {
    delete target.properties[color];
  }

  // Reset the pending action
  gameState.pendingAction = { type: "NONE" };

  // Check if this was the 3rd card played and end turn if so
  if (gameState.cardsPlayedThisTurn >= 3) {
    endTurn(gameState);
  }

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

  // Flatten all property cards from all sets of all colors
  const propertyCards = Object.values(target.properties).flatMap(
    (propertySets) => propertySets.flatMap((set) => set.cards)
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
      outer: for (const [color, propertySets] of Object.entries(
        target.properties
      )) {
        for (let setIndex = 0; setIndex < propertySets.length; setIndex++) {
          const set = propertySets[setIndex];
          const cardIndex = set.cards.findIndex((c) => c.id === cardId);

          if (cardIndex !== -1) {
            card = set.cards[cardIndex];
            location = "property";

            // Remove from source player's properties
            set.cards.splice(cardIndex, 1);

            // If set is now empty, remove it
            if (set.cards.length === 0) {
              propertySets.splice(setIndex, 1);

              // If no more sets for this color, remove the color entry
              if (propertySets.length === 0) {
                delete target.properties[color];
              }
            }
            break outer;
          }
        }
      }
    } else {
      // Remove from money pile
      target.moneyPile = target.moneyPile.filter((c) => c.id !== cardId);
    }

    if (!card) {
      return false;
    }

    paymentCardsToTransfer.push(card);
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
    if (card.type === CardType.PROPERTY) {
      // Add to collector's properties
      const color = card.isWildcard
        ? Object.keys(collector.properties)[0] || PropertyColor.BROWN
        : card.color!;

      if (!collector.properties[color]) {
        collector.properties[color] = [
          {
            cards: [],
            houses: 0,
            hotels: 0,
          },
        ];
      }

      // Find an incomplete set to add the property to
      const requiredSetSize = getRequiredSetSize(color as PropertyColor);
      let targetSet: PropertySet | undefined;

      // Try to find an incomplete set
      for (const set of collector.properties[color]) {
        if (set.cards.length < requiredSetSize) {
          targetSet = set;
          break;
        }
      }

      // If no incomplete set found, create a new one
      if (!targetSet) {
        const newSet: PropertySet = {
          cards: [],
          houses: 0,
          hotels: 0,
        };
        collector.properties[color].push(newSet);
        targetSet = newSet;
      }

      // Add the card to the target set
      targetSet.cards.push(card);
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
  return player.hand.find((card) => card.name === ActionCardName.JUST_SAY_NO);
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
      return executeDealBreaker(gameState, sourcePlayerId, playerId, color as PropertyColor);

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
  let theirSetIndex: number = -1;

  outer: for (const [color, propertySets] of Object.entries(
    target.properties
  )) {
    for (let setIndex = 0; setIndex < propertySets.length; setIndex++) {
      const set = propertySets[setIndex];
      const cardIndex = set.cards.findIndex((c) => c.id === targetCardId);

      if (cardIndex !== -1) {
        theirCard = set.cards[cardIndex];
        theirColor = color;
        theirSetIndex = setIndex;

        // Don't allow stealing if it would break a complete set
        const requiredSize = getRequiredSetSize(color as PropertyColor);
        if (set.cards.length === requiredSize) {
          return false;
        }

        // Remove from target player's properties
        set.cards.splice(cardIndex, 1);

        // If set is now empty, remove it
        if (set.cards.length === 0) {
          propertySets.splice(setIndex, 1);

          // If no more sets for this color, remove the color entry
          if (propertySets.length === 0) {
            delete target.properties[color];
          }
        }
        break outer;
      }
    }
  }

  if (!theirCard || !theirColor) {
    return false;
  }

  // Find the card in source player's properties
  let myCard: Card | undefined;
  let myColor: string | undefined;
  let mySetIndex: number = -1;

  outer: for (const [color, propertySets] of Object.entries(
    sourcePlayer.properties
  )) {
    for (let setIndex = 0; setIndex < propertySets.length; setIndex++) {
      const set = propertySets[setIndex];
      const cardIndex = set.cards.findIndex((c) => c.id === myCardId);

      if (cardIndex !== -1) {
        myCard = set.cards[cardIndex];
        myColor = color;
        mySetIndex = setIndex;

        // Remove from source player's properties
        set.cards.splice(cardIndex, 1);

        // If set is now empty, remove it
        if (set.cards.length === 0) {
          propertySets.splice(setIndex, 1);

          // If no more sets for this color, remove the color entry
          if (propertySets.length === 0) {
            delete sourcePlayer.properties[color];
          }
        }
        break outer;
      }
    }
  }

  if (!myCard || !myColor) {
    return false;
  }

  // Add target's card to source player's properties
  if (!sourcePlayer.properties[theirColor]) {
    sourcePlayer.properties[theirColor] = [
      {
        cards: [],
        houses: 0,
        hotels: 0,
      },
    ];
  }

  // Find an incomplete set to add the property to
  const theirRequiredSetSize = getRequiredSetSize(theirColor as PropertyColor);
  let sourceTargetSet: PropertySet | undefined;

  // Try to find an incomplete set
  for (const set of sourcePlayer.properties[theirColor]) {
    if (set.cards.length < theirRequiredSetSize) {
      sourceTargetSet = set;
      break;
    }
  }

  // If no incomplete set found, create a new one
  if (!sourceTargetSet) {
    const newSet: PropertySet = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
    sourcePlayer.properties[theirColor].push(newSet);
    sourceTargetSet = newSet;
  }

  // Add their card to source player's set
  sourceTargetSet.cards.push(theirCard);

  // Add source's card to target player's properties
  if (!target.properties[myColor]) {
    target.properties[myColor] = [
      {
        cards: [],
        houses: 0,
        hotels: 0,
      },
    ];
  }

  // Find an incomplete set to add the property to
  const myRequiredSetSize = getRequiredSetSize(myColor as PropertyColor);
  let targetSet: PropertySet | undefined;

  // Try to find an incomplete set
  for (const set of target.properties[myColor]) {
    if (set.cards.length < myRequiredSetSize) {
      targetSet = set;
      break;
    }
  }

  // If no incomplete set found, create a new one
  if (!targetSet) {
    const newSet: PropertySet = {
      cards: [],
      houses: 0,
      hotels: 0,
    };
    target.properties[myColor].push(newSet);
    targetSet = newSet;
  }

  // Add my card to target player's set
  targetSet.cards.push(myCard);

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

  // Flatten all property cards from all sets of all colors
  const propertyCards = Object.values(target.properties).flatMap(
    (propertySets) => propertySets.flatMap((set) => set.cards)
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
      outer: for (const [color, propertySets] of Object.entries(
        target.properties
      )) {
        for (let setIndex = 0; setIndex < propertySets.length; setIndex++) {
          const set = propertySets[setIndex];
          const cardIndex = set.cards.findIndex((c) => c.id === cardId);

          if (cardIndex !== -1) {
            card = set.cards[cardIndex];
            location = "property";

            // Remove from source player's properties
            set.cards.splice(cardIndex, 1);

            // If set is now empty, remove it
            if (set.cards.length === 0) {
              propertySets.splice(setIndex, 1);

              // If no more sets for this color, remove the color entry
              if (propertySets.length === 0) {
                delete target.properties[color];
              }
            }
            break outer;
          }
        }
      }
    } else {
      // Remove from money pile
      target.moneyPile = target.moneyPile.filter((c) => c.id !== cardId);
    }

    if (!card) {
      return false;
    }

    paymentCardsToTransfer.push(card);
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
    if (card.type === CardType.PROPERTY) {
      // Add to collector's properties
      const color = card.isWildcard
        ? Object.keys(collector.properties)[0] || PropertyColor.BROWN
        : card.color!;

      if (!collector.properties[color]) {
        collector.properties[color] = [
          {
            cards: [],
            houses: 0,
            hotels: 0,
          },
        ];
      }

      // Find an incomplete set to add the property to
      const requiredSetSize = getRequiredSetSize(color as PropertyColor);
      let targetSet: PropertySet | undefined;

      // Try to find an incomplete set
      for (const set of collector.properties[color]) {
        if (set.cards.length < requiredSetSize) {
          targetSet = set;
          break;
        }
      }

      // If no incomplete set found, create a new one
      if (!targetSet) {
        const newSet: PropertySet = {
          cards: [],
          houses: 0,
          hotels: 0,
        };
        collector.properties[color].push(newSet);
        targetSet = newSet;
      }

      // Add the card to the target set
      targetSet.cards.push(card);
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

  // Flatten all property cards from all sets of all colors
  const propertyCards = Object.values(target.properties).flatMap(
    (propertySets) => propertySets.flatMap((set) => set.cards)
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
      outer: for (const [color, propertySets] of Object.entries(
        target.properties
      )) {
        for (let setIndex = 0; setIndex < propertySets.length; setIndex++) {
          const set = propertySets[setIndex];
          const cardIndex = set.cards.findIndex((c) => c.id === cardId);

          if (cardIndex !== -1) {
            card = set.cards[cardIndex];
            location = "property";

            // Remove from source player's properties
            set.cards.splice(cardIndex, 1);

            // If set is now empty, remove it
            if (set.cards.length === 0) {
              propertySets.splice(setIndex, 1);

              // If no more sets for this color, remove the color entry
              if (propertySets.length === 0) {
                delete target.properties[color];
              }
            }
            break outer;
          }
        }
      }
    } else {
      // Remove from money pile
      target.moneyPile = target.moneyPile.filter((c) => c.id !== cardId);
    }

    if (!card) {
      return false;
    }

    paymentCardsToTransfer.push(card);
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
    if (card.type === CardType.PROPERTY) {
      // Add to birthday person's properties
      const color = card.isWildcard
        ? Object.keys(birthdayPerson.properties)[0] || PropertyColor.BROWN
        : card.color!;

      if (!birthdayPerson.properties[color]) {
        birthdayPerson.properties[color] = [
          {
            cards: [],
            houses: 0,
            hotels: 0,
          },
        ];
      }

      // Find an incomplete set to add the property to
      const requiredSetSize = getRequiredSetSize(color as PropertyColor);
      let targetSet: PropertySet | undefined;

      // Try to find an incomplete set
      for (const set of birthdayPerson.properties[color]) {
        if (set.cards.length < requiredSetSize) {
          targetSet = set;
          break;
        }
      }

      // If no incomplete set found, create a new one
      if (!targetSet) {
        const newSet: PropertySet = {
          cards: [],
          houses: 0,
          hotels: 0,
        };
        birthdayPerson.properties[color].push(newSet);
        targetSet = newSet;
      }

      // Add the card to the target set
      targetSet.cards.push(card);
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
