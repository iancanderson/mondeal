import React, { useState } from "react";
import { Player, Card } from "../types";
import CardView from "./CardView";

interface DebtCollectorModalProps {
  players: Player[];
  currentPlayerId: string;
  amount: number; // Default is $5M for Debt Collector
  onCollectDebt: (targetPlayerId: string, paymentCardIds: string[]) => void;
  onCancel: () => void;
}

function DebtCollectorModal({
  players,
  currentPlayerId,
  amount,
  onCollectDebt,
  onCancel,
}: DebtCollectorModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isBankrupt, setIsBankrupt] = useState(false);

  // Filter out the current player
  const otherPlayers = players.filter(
    (player) => player.id !== currentPlayerId
  );

  // If no eligible players, show a message
  if (otherPlayers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Debt Collector</h3>
          <p className="text-gray-700 mb-4">
            There are no other players to collect debt from.
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

  const handleCardClick = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleExecuteDebt = () => {
    if (selectedPlayerId) {
      onCollectDebt(
        selectedPlayerId,
        selectedCards.map((card) => card.id)
      );
    }
  };

  // Get available payment sources if a player is selected
  const getAvailableCards = () => {
    if (!selectedPlayer) return [];
    return [
      ...selectedPlayer.moneyPile,
      // Properly handle nested property sets
      ...Object.values(selectedPlayer.properties).flatMap((propertySets) =>
        propertySets.flatMap((set) => set.cards)
      ),
    ];
  };

  const availableCards = getAvailableCards();

  // Calculate total possible payment from all available cards
  const totalPossible = availableCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  // Calculate total value of selected cards
  const totalSelected = selectedCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  const handleBankruptcy = () => {
    setIsBankrupt(true);
    // Select all available cards for payment
    setSelectedCards(availableCards);
  };

  if (!selectedPlayerId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Debt Collector</h3>
          <p className="text-gray-700 mb-4">
            Select a player to collect ${amount}M from:
          </p>
          <div className="space-y-2">
            {otherPlayers.map((player) => (
              <button
                key={player.id}
                className="w-full bg-gray-100 hover:bg-gray-200 p-3 rounded text-left"
                onClick={() => setSelectedPlayerId(player.id)}
              >
                {player.name}
              </button>
            ))}
          </div>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Collect ${amount}M from {selectedPlayer?.name}
          </h3>
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={() => {
              setSelectedPlayerId(null);
              setSelectedCards([]);
              setIsBankrupt(false);
            }}
          >
            ← Back
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700">
            {selectedPlayer?.name} owes you ${amount}M.
          </p>
          {totalPossible < amount && !isBankrupt && (
            <div className="mt-2">
              <p className="text-red-600 mb-2">
                Warning: {selectedPlayer?.name} doesn't have enough cards to pay
                the full debt!
              </p>
              <button
                onClick={handleBankruptcy}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Declare Bankruptcy (Take all played cards)
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">
            {isBankrupt
              ? "All cards to be taken:"
              : `Select cards to collect (${amount}M total):`}
          </h4>
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {/* Money pile section */}
            {selectedPlayer && selectedPlayer.moneyPile.length > 0 && (
              <div className="border-b pb-3">
                <p className="font-medium mb-2">Money Pile:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlayer.moneyPile.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => !isBankrupt && handleCardClick(card)}
                      className={`
                        transform transition 
                        ${
                          isBankrupt
                            ? "opacity-50"
                            : selectedCards.find((c) => c.id === card.id)
                            ? "scale-110 ring-2 ring-blue-500"
                            : "hover:scale-105 cursor-pointer"
                        }
                      `}
                    >
                      <CardView card={card} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Properties section - updated for array of property sets */}
            {selectedPlayer &&
              Object.entries(selectedPlayer.properties).map(
                ([color, propertySets]) => (
                  <React.Fragment key={color}>
                    {propertySets.map((propertySet, setIndex) => (
                      <div
                        key={`${color}-${setIndex}`}
                        className="border-b pb-3"
                      >
                        <p className="font-medium mb-2">
                          {color} Properties (Set {setIndex + 1})
                          {(propertySet.houses > 0 ||
                            propertySet.hotels > 0) && (
                            <span className="text-sm text-gray-600 ml-2">
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
                            </span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {propertySet.cards.map((card) => (
                            <div
                              key={card.id}
                              onClick={() =>
                                !isBankrupt && handleCardClick(card)
                              }
                              className={`
                              transform transition 
                              ${
                                isBankrupt
                                  ? "opacity-50"
                                  : selectedCards.find((c) => c.id === card.id)
                                  ? "scale-110 ring-2 ring-blue-500"
                                  : "hover:scale-105 cursor-pointer"
                              }
                            `}
                            >
                              <CardView card={card} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                )
              )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-gray-700">
            Selected: ${totalSelected}M / ${amount}M required
            {isBankrupt && " (Bankruptcy)"}
          </div>
          <div className="space-x-2">
            <button
              onClick={handleExecuteDebt}
              disabled={!isBankrupt && totalSelected < amount}
              className={`px-4 py-2 rounded ${
                isBankrupt || totalSelected >= amount
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isBankrupt ? "Take All Cards" : "Collect Debt"}
            </button>
          </div>
        </div>

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

export default DebtCollectorModal;
