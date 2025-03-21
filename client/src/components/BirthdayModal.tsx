import React, { useState } from "react";
import { Player, Card, ActionState } from "../types";
import CardView from "./CardView";

interface BirthdayModalProps {
  pendingAction: ActionState;
  birthdayPlayer: Player;
  targetPlayer: Player;
  onPayBirthdayGift: (cardIds: string[]) => void;
}

function BirthdayModal({
  pendingAction,
  birthdayPlayer,
  targetPlayer,
  onPayBirthdayGift,
}: BirthdayModalProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isBankrupt, setIsBankrupt] = useState(false);

  if (pendingAction.type !== "BIRTHDAY") return null;

  // Don't show modal if player has already paid
  if (!pendingAction.remainingPayers.includes(targetPlayer.id)) return null;

  const { amount } = pendingAction;

  // Calculate total value of selected cards
  const totalSelected = selectedCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  // Get all cards that could be used for payment (money pile + property cards)
  const moneyPileCards = targetPlayer.moneyPile;
  const propertyCards = Object.values(targetPlayer.properties).flatMap(
    propertySets => propertySets.flatMap(set => set.cards)
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
    onPayBirthdayGift(selectedCards.map((card) => card.id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">
          It's {birthdayPlayer.name}'s Birthday!
        </h3>

        <div className="mb-4">
          <p className="text-gray-700">
            {birthdayPlayer.name} says it's their birthday! You owe them $
            {amount}M.
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
            {Object.entries(targetPlayer.properties).map(([color, propertySets]) => (
              <React.Fragment key={color}>
                {propertySets.map((propertySet, setIndex) => (
                  <div key={`${color}-${setIndex}`} className="border-b pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">{color} Properties (Set {setIndex + 1})</p>
                      {(propertySet.houses > 0 || propertySet.hotels > 0) && (
                        <span className="text-sm text-gray-600">
                          {propertySet.houses > 0 && `${propertySet.houses} House${propertySet.houses > 1 ? 's' : ''}`}
                          {propertySet.houses > 0 && propertySet.hotels > 0 && ', '}
                          {propertySet.hotels > 0 && `${propertySet.hotels} Hotel${propertySet.hotels > 1 ? 's' : ''}`}
                        </span>
                      )}
                    </div>
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
            ))}
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
              {isBankrupt ? "Surrender All Cards" : "Pay Birthday Gift"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BirthdayModal;
