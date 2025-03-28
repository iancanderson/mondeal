import React, { useState } from "react";
import { Player, Card, ActionState } from "../types";
import CardView from "./CardView";

interface RentModalProps {
  pendingAction: ActionState;
  currentPlayer: Player;
  targetPlayer: Player;
  onPayRent: (cardIds: string[]) => void;
}

function RentModal({
  pendingAction,
  currentPlayer,
  targetPlayer,
  onPayRent,
}: RentModalProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isBankrupt, setIsBankrupt] = useState(false);

  // Support both RENT and DEBT_COLLECTOR action types
  if (pendingAction.type !== "RENT" && pendingAction.type !== "DEBT_COLLECTOR")
    return null;

  // Don't show modal if player has already paid rent (for RENT type only)
  if (
    pendingAction.type === "RENT" &&
    !pendingAction.remainingPayers.includes(targetPlayer.id)
  )
    return null;

  // For both RENT and DEBT_COLLECTOR, we need an amount
  const { amount } = pendingAction;

  // Calculate total value of selected cards
  const totalSelected = selectedCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  // Get all cards that could be used for payment (money pile + property cards)
  const moneyPileCards = targetPlayer.moneyPile;

  // Fix: Properly handle the nested property sets structure
  const propertyCards = Object.values(targetPlayer.properties).flatMap(
    (propertySets) => propertySets.flatMap((set) => set.cards)
  );

  const availableCards = [...moneyPileCards, ...propertyCards];

  // Calculate total possible payment from all available cards
  const totalPossible = availableCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  const handleCardClick = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleBankruptcy = () => {
    setIsBankrupt(true);
    // Select all available cards for payment
    setSelectedCards(availableCards);
  };

  const handleSubmit = () => {
    onPayRent(selectedCards.map((card) => card.id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">
          {pendingAction.type === "RENT"
            ? `Pay Rent to ${currentPlayer.name}`
            : `Pay Debt to ${currentPlayer.name}`}
        </h3>

        <div className="mb-4">
          <p className="text-gray-700">
            {pendingAction.type === "RENT"
              ? `You owe $${amount}M in rent for ${pendingAction.color} properties.`
              : `You owe $${amount}M to ${currentPlayer.name} for the Debt Collector.`}
          </p>
          {totalPossible < amount && !isBankrupt && (
            <div className="mt-2">
              <p className="text-red-600 mb-2">
                Warning: You don't have enough cards to pay the full amount!
              </p>
              <button
                onClick={handleBankruptcy}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Declare Bankruptcy (Give up all played cards)
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">
            {isBankrupt
              ? "All cards to be surrendered:"
              : "Select cards to pay with:"}
          </h4>
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {/* Money pile section */}
            {moneyPileCards.length > 0 && (
              <div className="border-b pb-3">
                <p className="font-medium mb-2">Money Pile:</p>
                <div className="flex flex-wrap gap-2">
                  {moneyPileCards.map((card) => (
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
            {Object.entries(targetPlayer.properties).map(
              ([color, propertySets]) => (
                <React.Fragment key={color}>
                  {propertySets.map((propertySet, setIndex) => (
                    <div
                      key={`${color}-set-${setIndex}`}
                      className="border-b pb-3"
                    >
                      <p className="font-medium mb-2">
                        {color} Properties (Set {setIndex + 1}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {propertySet.cards.map((card) => (
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
              onClick={handleSubmit}
              disabled={!isBankrupt && totalSelected < amount}
              className={`px-4 py-2 rounded ${
                isBankrupt || totalSelected >= amount
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isBankrupt
                ? "Surrender All Cards"
                : pendingAction.type === "RENT"
                ? "Pay Rent"
                : "Pay Debt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentModal;
