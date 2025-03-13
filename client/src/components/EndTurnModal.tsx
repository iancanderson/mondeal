import React from "react";

interface EndTurnModalProps {
  remainingActions: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function EndTurnModal({
  remainingActions,
  onConfirm,
  onCancel,
}: EndTurnModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">End Your Turn?</h3>
        <p className="text-gray-700 mb-4">
          You still have {remainingActions} action
          {remainingActions !== 1 ? "s" : ""} remaining. Are you sure you want
          to end your turn?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Yes, End Turn
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EndTurnModal;
