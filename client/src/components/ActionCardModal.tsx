import React from "react";
import { Card, PropertyColor } from "../types";
import { ColorPicker } from "./ColorPicker";

interface ActionCardModalProps {
  card: Card;
  onPlayAsMoney: () => void;
  onPlayAsAction: (color?: PropertyColor) => void;
  onCancel: () => void;
}

function ActionCardModal({
  card,
  onPlayAsMoney,
  onPlayAsAction,
  onCancel,
}: ActionCardModalProps) {
  const [showingColorPicker, setShowingColorPicker] = React.useState(false);

  const actionDescription =
    card.type === "RENT"
      ? "Charge rent to other players"
      : `${card.name} action`;

  if (showingColorPicker && card.type === "RENT") {
    return (
      <ColorPicker
        onColorPick={(color) => {
          setShowingColorPicker(false);
          onPlayAsAction(color);
        }}
        onCancel={() => {
          setShowingColorPicker(false);
          onCancel();
        }}
        availableColors={card.rentColors}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-2">Play {card.name}</h3>
        <p className="text-gray-600 mb-4">
          How would you like to play this card?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPlayAsMoney}
            className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 flex flex-col items-center"
          >
            <span className="font-bold">As Money</span>
            <span className="text-sm mt-1">Value: ${card.value}M</span>
          </button>

          <button
            onClick={() => {
              if (card.type === "RENT") {
                setShowingColorPicker(true);
              } else {
                onPlayAsAction();
              }
            }}
            className="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex flex-col items-center"
          >
            <span className="font-bold">
              As {card.type === "RENT" ? "Rent" : "Action"}
            </span>
            <span className="text-sm mt-1">{actionDescription}</span>
          </button>
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

export default ActionCardModal;
