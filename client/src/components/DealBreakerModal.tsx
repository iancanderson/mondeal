import React, { useState } from "react";
import { Player, Card, PropertySet, PropertyColor } from "../types";
import CardView from "./CardView";
import { getRequiredSetSize } from "../utils";

interface DealBreakerModalProps {
  players: Player[];
  currentPlayerId: string;
  onSelectPropertySet: (targetPlayerId: string, color: PropertyColor) => void;
  onCancel: () => void;
}

function DealBreakerModal({
  players,
  currentPlayerId,
  onSelectPropertySet,
  onCancel,
}: DealBreakerModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Filter out the current player and players with no complete property sets
  const eligiblePlayers = players.filter((player) => {
    if (player.id === currentPlayerId) return false;
    // Check if player has any complete sets
    return Object.entries(player.properties).some(([color, propertySets]) => {
      if (!propertySets || propertySets.length === 0) return false;
      const requiredSize = getRequiredSetSize(color as PropertyColor);
      // Check if any set for this color is complete
      return propertySets.some((set) => set.cards.length >= requiredSize);
    });
  });

  // If no eligible players, show a message
  if (eligiblePlayers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Deal Breaker</h3>
          <p className="text-gray-700 mb-4">
            No players have complete property sets that you can steal.
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

  // Get all complete property sets from the selected player
  const completePropertySets: {
    color: PropertyColor;
    cards: Card[];
    propertySet: PropertySet;
  }[] = [];

  if (selectedPlayer) {
    Object.entries(selectedPlayer.properties).forEach(
      ([color, propertySets]) => {
        if (!propertySets || propertySets.length === 0) return;

        const requiredSize = getRequiredSetSize(color as PropertyColor);
        // Check each set for this color
        propertySets.forEach((propertySet) => {
          if (propertySet.cards.length >= requiredSize) {
            completePropertySets.push({
              color: color as PropertyColor,
              cards: propertySet.cards,
              propertySet, // Keep reference to the full property set for displaying houses/hotels
            });
          }
        });
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-4">
          Select a complete property set to steal
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

        {/* Step 2: Select a property set */}
        {selectedPlayerId && completePropertySets.length > 0 && (
          <>
            <div className="flex justify-between mb-4">
              <span>
                Stealing from: <strong>{selectedPlayer?.name}</strong>
              </span>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => setSelectedPlayerId(null)}
              >
                ← Back
              </button>
            </div>
            <p className="text-gray-700 mb-2">
              Select a complete property set to steal:
            </p>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {completePropertySets.map(
                ({ color, cards, propertySet }, index) => (
                  <div key={`${color}-${index}`} className="border-b pb-3">
                    <button
                      className="w-full text-left p-2 hover:bg-gray-100 rounded"
                      onClick={() =>
                        onSelectPropertySet(selectedPlayerId, color)
                      }
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{color}</p>
                        {(propertySet.houses > 0 || propertySet.hotels > 0) && (
                          <p className="text-sm text-gray-600">
                            {propertySet.houses > 0 &&
                              `${propertySet.houses} House${
                                propertySet.houses > 1 ? "s" : ""
                              }`}
                            {propertySet.houses > 0 &&
                              propertySet.hotels > 0 &&
                              ", "}
                            {propertySet.hotels > 0 &&
                              `${propertySet.hotels} Hotel${
                                propertySet.hotels > 1 ? "s" : ""
                              }`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cards.map((card) => (
                          <div key={card.id}>
                            <CardView card={card} />
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>
                )
              )}
            </div>
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

export default DealBreakerModal;
