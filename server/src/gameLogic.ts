import { Card, Player, GameState } from "./types";
import { v4 as uuidv4 } from "uuid";

/**
 * Create an initial deck of simplified Monopoly Deal cards.
 * Adjust as needed for more realistic or complete sets.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  // Example property sets: Red, Blue, Green
  const colors = ["Red", "Blue", "Green"];
  for (const color of colors) {
    for (let i = 1; i <= 3; i++) {
      deck.push({
        id: uuidv4(),
        name: `${color} Property ${i}`,
        type: "PROPERTY",
        value: 2,
        color: color,
      });
    }
  }

  // Add some money cards
  for (let i = 0; i < 10; i++) {
    deck.push({
      id: uuidv4(),
      name: `Money ${i + 1}`,
      type: "MONEY",
      value: 1,
    });
  }

  // Add a few action cards
  for (let i = 0; i < 5; i++) {
    deck.push({
      id: uuidv4(),
      name: `Action Card ${i + 1}`,
      type: "ACTION",
      value: 2,
    });
  }

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
export function checkWinCondition(player: Player): boolean {
  let completedSets = 0;
  for (const color in player.properties) {
    // in this simplified rule, 3 or more cards of the same color is a "full set"
    if (player.properties[color].length >= 3) {
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
