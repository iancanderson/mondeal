import React from "react";
import { Player, Card } from "../types";
import CardView from "./CardView";

interface PlayerAreaProps {
  player: Player;
}

function PlayerArea({ player }: PlayerAreaProps) {
  const propertyOrder = [
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
    <div className="border rounded-lg p-2 flex-1 bg-white shadow-sm">
      <h3 className="font-bold text-lg border-b pb-1">{player.name}</h3>

      <div className="mt-2">
        <div className="text-sm font-semibold mb-1">Properties:</div>
        <div className="flex flex-wrap gap-2">
          {propertyOrder.map((color) => {
            const cards = player.properties[color] || [];
            if (cards.length === 0) return null;

            return (
              <div key={color} className="flex-shrink-0">
                <div className="text-xs text-gray-600 mb-0.5">{color}</div>
                <div className="flex gap-0.5">
                  {cards.map((card: Card) => (
                    <div key={card.id}>
                      <CardView card={card} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2">
        <div className="text-sm font-semibold mb-1">Bank:</div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {player.moneyPile.map((card: Card) => (
            <CardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerArea;
