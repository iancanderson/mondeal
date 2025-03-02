import React from "react";

interface ColorPickerProps {
  onColorPick: (color: string) => void;
  onCancel: () => void;
}

export function ColorPicker({ onColorPick, onCancel }: ColorPickerProps) {
  const colors = [
    { name: "Brown", bgColor: "bg-amber-900" },
    { name: "LightBlue", bgColor: "bg-sky-400" },
    { name: "Purple", bgColor: "bg-purple-600" },
    { name: "Orange", bgColor: "bg-orange-500" },
    { name: "Red", bgColor: "bg-red-600" },
    { name: "Yellow", bgColor: "bg-yellow-400" },
    { name: "Green", bgColor: "bg-green-600" },
    { name: "Blue", bgColor: "bg-blue-600" },
    { name: "Railroad", bgColor: "bg-gray-800" },
    { name: "Utility", bgColor: "bg-gray-600" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Choose a property color:</h3>
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => onColorPick(color.name)}
              className={`px-4 py-2 text-sm rounded hover:bg-gray-100 w-full text-left ${color.bgColor} text-white`}
            >
              {color.name}
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
