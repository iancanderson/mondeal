import React, { useState } from "react";
import { Player } from "../types";

interface DebtCollectorModalProps {
  players: Player[];
  currentPlayerId: string;
  onCollectDebt: (targetPlayerId: string) => void;
  onCancel: () => void;
}

function DebtCollectorModal({
  players,
  currentPlayerId,
  onCollectDebt,
  onCancel,
}: DebtCollectorModalProps) {
  // Filter out the current player
  const otherPlayers = players.filter(
    (player) => player.id !== currentPlayerId
  );

  // If no eligible players, show a message
  if (otherPlayers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Debt Collector</h3>
          <p className="text-gray-700 mb-4">
            There are no other players to collect debt from.
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
        <h3 className="text-lg font-semibold mb-4">Debt Collector</h3>
        <p className="text-gray-700 mb-4">
          Select a player to collect $5M from:
        </p>
        <div className="space-y-2">
          {otherPlayers.map((player) => (
            <button
              key={player.id}
              className="w-full bg-gray-100 hover:bg-gray-200 p-3 rounded text-left"
              onClick={() => onCollectDebt(player.id)}
            >
              {player.name}
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

export default DebtCollectorModal;
