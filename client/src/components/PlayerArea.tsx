import React from "react";
import { Player, Card } from "../types";
import CardView from "./CardView";

interface PlayerAreaProps {
  player: Player;
}

function PlayerArea({ player }: PlayerAreaProps) {
  return (
    <div className="border p-4 flex-1">
      <h3 className="font-bold">{player.name}</h3>
      <div className="my-2">
        <div className="text-sm font-semibold">Properties:</div>
        {Object.entries(player.properties).map(([color, cards]) => (
          <div key={color} className="border-b py-1">
            <div className="text-xs text-gray-600">{color}</div>
            <div className="flex gap-2">
              {cards.map((card: Card) => (
                <CardView key={card.id} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-sm font-semibold">Money Pile:</div>
        <div className="flex gap-2">
          {player.moneyPile.map((card: Card) => (
            <CardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerArea;
