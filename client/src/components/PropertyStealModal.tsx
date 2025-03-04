import React, { useState } from "react";
import { Player, Card } from "../types";
import CardView from "./CardView";

interface PropertyStealModalProps {
  players: Player[];
  currentPlayerId: string;
  onSelectProperty: (targetPlayerId: string, cardId: string) => void;
  onCancel: () => void;
}

function PropertyStealModal({
  players,
  currentPlayerId,
  onSelectProperty,
  onCancel,
}: PropertyStealModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Helper function to get required set size
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

  // Helper function to check if a player has any stealable properties
  function hasStealableProperties(player: Player): boolean {
    return Object.entries(player.properties).some(([color, propertySets]) => {
      if (!propertySets || propertySets.length === 0) return false;

      const requiredSize = getRequiredSetSize(color);
      // Check if any set has cards but is not complete
      return propertySets.some(
        (set) => set.cards.length > 0 && set.cards.length < requiredSize
      );
    });
  }

  // Filter out the current player and players with no stealable properties
  const eligiblePlayers = players.filter(
    (player) => player.id !== currentPlayerId && hasStealableProperties(player)
  );

  // If no eligible players, show a message
  if (eligiblePlayers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Sly Deal</h3>
          <p className="text-gray-700 mb-4">
            No players have properties that you can steal. (Complete sets cannot
            be broken up)
          </p>
          <button
            onClick={onCancel}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const selectedPlayer = selectedPlayerId
    ? players.find((p) => p.id === selectedPlayerId)
    : null;

  // Get all stealable properties from the selected player (not in complete sets)
  const stealableProperties: { color: string; cards: Card[] }[] = [];

  if (selectedPlayer) {
    Object.entries(selectedPlayer.properties).forEach(
      ([color, propertySets]) => {
        if (!propertySets || propertySets.length === 0) return;

        const requiredSize = getRequiredSetSize(color);

        // For each property set of this color
        propertySets.forEach((propertySet) => {
          // Determine if we can steal from this set (not a complete set)
          if (
            propertySet.cards.length > 0 &&
            propertySet.cards.length < requiredSize
          ) {
            stealableProperties.push({ color, cards: propertySet.cards });
          }
        });
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-4">
          Select a property to steal
        </h3>
        {/* Step 1: Select a player */}
        {!selectedPlayerId && (
          <>
            <p className="text-gray-700 mb-4">Choose a player to steal from:</p>
            <div className="space-y-2">
              {eligiblePlayers.map((player) => (
                <button
                  key={player.id}
                  className="w-full bg-gray-100 hover:bg-gray-200 p-3 rounded text-left"
                  onClick={() => setSelectedPlayerId(player.id)}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Select a property */}
        {selectedPlayerId && stealableProperties.length > 0 && (
          <>
            <div className="flex justify-between mb-4">
              <span>
                Stealing from: <strong>{selectedPlayer?.name}</strong>
              </span>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setSelectedPlayerId(null);
                  setSelectedCard(null);
                }}
              >
                ← Back
              </button>
            </div>
            <p className="text-gray-700 mb-2">
              Select a property to steal (complete sets cannot be stolen):
            </p>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {stealableProperties.map(({ color, cards }, index) => (
                <div key={`${color}-${index}`} className="border-b pb-3">
                  <p className="font-medium mb-2">
                    {color} (Set {index + 1})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className={`cursor-pointer transform transition ${
                          selectedCard?.id === card.id
                            ? "scale-110 ring-2 ring-blue-500"
                            : "hover:scale-105"
                        }`}
                      >
                        <CardView card={card} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() =>
                  selectedCard &&
                  onSelectProperty(selectedPlayerId, selectedCard.id)
                }
                disabled={!selectedCard}
                className={`px-4 py-2 rounded ${
                  selectedCard
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Steal Property
              </button>
            </div>
          </>
        )}

        {selectedPlayerId && stealableProperties.length === 0 && (
          <>
            <p className="text-gray-700 mb-4">
              {selectedPlayer?.name} doesn't have any properties you can steal.
              (Complete sets cannot be broken up)
            </p>
            <button
              onClick={() => setSelectedPlayerId(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Back
            </button>
          </>
        )}

        <button
          onClick={onCancel}
          className="w-full mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PropertyStealModal;
