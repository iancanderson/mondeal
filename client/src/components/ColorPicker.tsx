import React from "react";

interface ColorPickerProps {
  onColorPick: (color: string) => void;
  onCancel: () => void;
}

export function ColorPicker({ onColorPick, onCancel }: ColorPickerProps) {
  const colors = [
    "Brown",
    "LightBlue",
    "Purple",
    "Orange",
    "Red",
    "Yellow",
    "Green",
    "Blue",
    "Railroad",
    "Utility",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Choose a property color:</h3>
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorPick(color)}
              className="px-4 py-2 text-sm rounded hover:bg-gray-100 w-full text-left"
            >
              {color}
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
