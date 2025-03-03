import React, { useState } from "react";
import { Card } from "../types";
import CardView from "./CardView";

interface DiscardModalProps {
  cards: Card[];
  onDiscard: (cardIds: string[]) => void;
}

function DiscardModal({ cards, onDiscard }: DiscardModalProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const cardsToDiscard = cards.length - 7;

  const handleCardClick = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < cardsToDiscard) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleSubmit = () => {
    if (selectedCards.length === cardsToDiscard) {
      onDiscard(selectedCards.map((c) => c.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">Discard Down to 7 Cards</h3>
        <p className="text-gray-700 mb-4">
          Select {cardsToDiscard} card{cardsToDiscard !== 1 ? "s" : ""} to
          discard:
        </p>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`transform transition ${
                  selectedCards.find((c) => c.id === card.id)
                    ? "scale-110 ring-2 ring-blue-500"
                    : "hover:scale-105 cursor-pointer"
                }`}
              >
                <CardView card={card} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-gray-700">
            Selected: {selectedCards.length} / {cardsToDiscard} required
          </div>
          <button
            onClick={handleSubmit}
            disabled={selectedCards.length !== cardsToDiscard}
            className={`px-4 py-2 rounded ${
              selectedCards.length === cardsToDiscard
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Discard Cards
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiscardModal;
