import React, { useState } from "react";
import { Player, Card } from "../types";
import CardView from "./CardView";

interface ForcedDealModalProps {
  players: Player[];
  currentPlayerId: string;
  onExecuteForcedDeal: (
    targetPlayerId: string,
    targetCardId: string,
    myCardId: string
  ) => void;
}

function ForcedDealModal({
  players,
  currentPlayerId,
  onExecuteForcedDeal,
}: ForcedDealModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTargetCard, setSelectedTargetCard] = useState<Card | null>(
    null
  );
  const [selectedMyCard, setSelectedMyCard] = useState<Card | null>(null);
  const [step, setStep] = useState<
    "selectPlayer" | "selectTargetProperty" | "selectMyProperty"
  >("selectPlayer");

  // Get the current player
  const currentPlayer = players.find((player) => player.id === currentPlayerId);

  // Filter out players with no available properties
  const eligiblePlayers = players.filter(
    (player) =>
      player.id !== currentPlayerId &&
      Object.values(player.properties).some((set) => set.cards.length > 0)
  );

  // If no eligible players, show an informative message but no close button
  if (eligiblePlayers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">
            Forced Deal Cannot Be Completed
          </h3>
          <p className="text-gray-700 mb-4">
            No players have properties that you can trade for. The card will be
            discarded.
          </p>
        </div>
      </div>
    );
  }

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

  // Get all stealable properties from the selected player (not in complete sets)
  const getStealableProperties = (player: Player | undefined) => {
    if (!player) return [];

    const stealableProperties: { color: string; cards: Card[] }[] = [];

    Object.entries(player.properties).forEach(([color, propertySet]) => {
      // Determine if we can steal from this color group (not a complete set)
      const requiredSize = getRequiredSetSize(color);
      if (propertySet.cards.length !== requiredSize) {
        stealableProperties.push({ color, cards: propertySet.cards });
      }
    });

    return stealableProperties;
  };

  // Get all properties from current player
  const getMyProperties = () => {
    if (!currentPlayer) return [];

    const myProperties: { color: string; cards: Card[] }[] = [];

    Object.entries(currentPlayer.properties).forEach(([color, propertySet]) => {
      if (propertySet.cards.length > 0) {
        myProperties.push({ color, cards: propertySet.cards });
      }
    });

    return myProperties;
  };

  const selectedPlayer = selectedPlayerId
    ? players.find((p) => p.id === selectedPlayerId)
    : null;

  const stealableProperties = getStealableProperties(
    selectedPlayer || undefined
  );
  const myProperties = getMyProperties();

  // Check if current player has any properties
  if (myProperties.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">
            Forced Deal Cannot Be Completed
          </h3>
          <p className="text-gray-700 mb-4">
            You don't have any properties to trade. The card will be discarded.
          </p>
        </div>
      </div>
    );
  }

  const handleExecuteDeal = () => {
    if (selectedTargetCard && selectedMyCard && selectedPlayerId) {
      onExecuteForcedDeal(
        selectedPlayerId,
        selectedTargetCard.id,
        selectedMyCard.id
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-4">
          Forced Deal: Trade Properties
        </h3>

        {/* Step 1: Select a player */}
        {step === "selectPlayer" && (
          <>
            <p className="text-gray-700 mb-4">Choose a player to trade with:</p>
            <div className="space-y-2">
              {eligiblePlayers.map((player) => (
                <button
                  key={player.id}
                  className="w-full bg-gray-100 hover:bg-gray-200 p-3 rounded text-left"
                  onClick={() => {
                    setSelectedPlayerId(player.id);
                    setStep("selectTargetProperty");
                  }}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Select their property to take */}
        {step === "selectTargetProperty" && selectedPlayerId && (
          <>
            <div className="flex justify-between mb-4">
              <span>
                Trading with: <strong>{selectedPlayer?.name}</strong>
              </span>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setSelectedPlayerId(null);
                  setSelectedTargetCard(null);
                  setStep("selectPlayer");
                }}
              >
                ← Back
              </button>
            </div>

            <p className="text-gray-700 mb-2">
              Select a property to take (complete sets cannot be broken up):
            </p>

            {stealableProperties.length > 0 ? (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {stealableProperties.map(({ color, cards }) => (
                  <div key={color} className="border-b pb-3">
                    <p className="font-medium mb-2">{color}</p>
                    <div className="flex flex-wrap gap-2">
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => {
                            setSelectedTargetCard(card);
                            setStep("selectMyProperty");
                          }}
                          className={`cursor-pointer transform transition hover:scale-105`}
                        >
                          <CardView card={card} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 my-4">
                {selectedPlayer?.name} doesn't have any properties that can be
                traded. (Complete sets cannot be broken up)
              </p>
            )}
          </>
        )}

        {/* Step 3: Select your property to give */}
        {step === "selectMyProperty" && selectedTargetCard && (
          <>
            <div className="flex justify-between mb-4">
              <span>
                Selected: <strong>{selectedTargetCard.name}</strong> from{" "}
                {selectedPlayer?.name}
              </span>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setSelectedTargetCard(null);
                  setStep("selectTargetProperty");
                }}
              >
                ← Back
              </button>
            </div>

            <p className="text-gray-700 mb-2">
              Now select one of your properties to trade:
            </p>

            <div className="space-y-4 max-h-60 overflow-y-auto">
              {myProperties.map(({ color, cards }) => (
                <div key={color} className="border-b pb-3">
                  <p className="font-medium mb-2">{color}</p>
                  <div className="flex flex-wrap gap-2">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedMyCard(card)}
                        className={`cursor-pointer transform transition ${
                          selectedMyCard?.id === card.id
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
                onClick={handleExecuteDeal}
                disabled={!selectedMyCard}
                className={`px-4 py-2 rounded ${
                  selectedMyCard
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Execute Trade
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ForcedDealModal;
