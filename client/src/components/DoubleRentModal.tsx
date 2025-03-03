import React from "react";
import { Card } from "../types";
import CardView from "./CardView";

interface DoubleRentModalProps {
  rentCards: Card[];
  onSelectRentCard: (cardId: string) => void;
  onCancel: () => void;
}

function DoubleRentModal({
  rentCards,
  onSelectRentCard,
  onCancel,
}: DoubleRentModalProps) {
  if (rentCards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Double The Rent</h3>
          <p className="text-gray-700 mb-4">
            You don't have any rent cards to play with Double The Rent.
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Double The Rent</h3>
        <p className="text-gray-700 mb-4">
          Select a rent card to play with Double The Rent:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {rentCards.map((card) => (
            <div
              key={card.id}
              onClick={() => onSelectRentCard(card.id)}
              className="transform transition hover:scale-105 cursor-pointer"
            >
              <CardView card={card} />
            </div>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DoubleRentModal;