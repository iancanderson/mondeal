import { Card, Player, GameState } from "./types";
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
    Railroad: ["Reading Railroad", "Pennsylvania Railroad", "B&O Railroad", "Short Line"],
    Utility: ["Electric Company", "Water Works"]
  };

  // Add property cards
  Object.entries(properties).forEach(([color, propertyNames]) => {
    propertyNames.forEach(name => {
      deck.push({
        id: uuidv4(),
        name,
        type: "PROPERTY",
        value: color === "Railroad" || color === "Utility" ? 2 : 3,
        color
      });
    });
  });

  // Add money cards with real values
  const moneyValues = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5];
  moneyValues.forEach(value => {
    deck.push({
      id: uuidv4(),
      name: `$${value}M`,
      type: "MONEY",
      value
    });
  });

  // Add action cards with real names
  const actionCards = [
    "Deal Breaker",
    "Just Say No",
    "Sly Deal",
    "Forced Deal",
    "Debt Collector",
    "It's My Birthday",
    "Double The Rent",
    "House",
    "Hotel",
    "Pass Go"
  ];

  actionCards.forEach(name => {
    deck.push({
      id: uuidv4(),
      name,
      type: "ACTION",
      value: 1
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

export function checkWinCondition(player: Player): boolean {
  let completedSets = 0;
  for (const color in player.properties) {
    const requiredSize = getRequiredSetSize(color);
    if (player.properties[color].length >= requiredSize) {
      completedSets++;
    }
  }
  return completedSets >= 3;
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
}

/**
 * Handle playing a card from hand to property/money pile.
 * Simplified:
 * - PROPERTY -> goes to properties
 * - MONEY/ACTION -> goes to money pile (though real game might treat action differently)
 */
export function playCard(
  gameState: GameState,
  playerId: string,
  cardId: string
) {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return;

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return;

  const card = player.hand[cardIndex];
  // Remove from player's hand
  player.hand.splice(cardIndex, 1);

  if (card.type === "PROPERTY" && card.color) {
    if (!player.properties[card.color]) {
      player.properties[card.color] = [];
    }
    player.properties[card.color].push(card);
  } else {
    // For MONEY or ACTION, just put it in money pile
    player.moneyPile.push(card);
  }
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
