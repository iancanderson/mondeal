import React, { useState } from "react";
import { Player, Card, ActionState } from "../types";
import CardView from "./CardView";

interface RentModalProps {
  pendingAction: ActionState;
  currentPlayer: Player;
  targetPlayer: Player;
  onPayRent: (cardIds: string[]) => void;
  onCancel: () => void;
}

function RentModal({
  pendingAction,
  currentPlayer,
  targetPlayer,
  onPayRent,
  onCancel,
}: RentModalProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  if (pendingAction.type !== "RENT") return null;

  const { amount } = pendingAction;

  // Calculate total value of selected cards
  const totalSelected = selectedCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  // Get all cards that could be used for payment (hand + money pile)
  const allCards = [...targetPlayer.hand, ...targetPlayer.moneyPile];

  // Calculate total possible payment
  const totalPossible = allCards.reduce((sum, card) => sum + card.value, 0);

  const handleCardClick = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleSubmit = () => {
    if (totalSelected >= amount) {
      onPayRent(selectedCards.map((card) => card.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">
          Pay Rent to {currentPlayer.name}
        </h3>

        <div className="mb-4">
          <p className="text-gray-700">
            You owe ${amount}M in rent for {pendingAction.color} properties.
          </p>
          {totalPossible < amount && (
            <p className="text-red-600 mt-2">
              Warning: You don't have enough money to pay the full rent!
            </p>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Select cards to pay with:</h4>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
            {allCards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`cursor-pointer transform transition ${
                  selectedCards.find((c) => c.id === card.id)
                    ? "scale-110 ring-2 ring-blue-500"
                    : "hover:scale-105"
                }`}
              >
                <CardView card={card} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-gray-700">
            Selected: ${totalSelected}M / ${amount}M required
          </div>
          <div className="space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={totalSelected < amount}
              className={`px-4 py-2 rounded ${
                totalSelected >= amount
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Pay Rent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentModal;
