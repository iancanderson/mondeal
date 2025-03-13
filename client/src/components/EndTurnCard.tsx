import React from "react";

interface EndTurnCardProps {
  remainingActions: number;
  onClick: () => void;
}

function EndTurnCard({ remainingActions, onClick }: EndTurnCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative border-2 rounded-xl w-24 h-36 flex flex-col overflow-hidden
        shadow-md transition-all duration-200 select-none text-center
        hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer
        bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="text-sm font-bold mb-1 leading-tight drop-shadow-sm p-2 text-gray-700">
        End Turn
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl">⏱️</div>
      </div>

      <div className="bg-gray-100 py-1.5 text-center">
        <div className="text-xs font-medium text-gray-600">
          {remainingActions} action{remainingActions !== 1 ? "s" : ""} left
        </div>
      </div>
    </div>
  );
}

export default EndTurnCard;
