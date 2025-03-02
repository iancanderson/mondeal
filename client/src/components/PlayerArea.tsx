import React from "react";
import { Player } from "../types";
import CardView from "./CardView";

interface PlayerAreaProps {
  player: Player;
}

function PlayerArea({ player }: PlayerAreaProps) {
  return (
    <div className="border p-2 w-64">
      <h3 className="font-bold mb-2">{player.name}</h3>
      <div className="mb-2">
        <h4 className="font-semibold">Properties:</h4>
        {Object.keys(player.properties).map((color) => (
          <div key={color}>
            <span className="underline">{color}:</span>
            <div className="flex gap-1">
              {player.properties[color].map((card) => (
                <CardView key={card.id} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <h4 className="font-semibold">Money/Action:</h4>
        <div className="flex gap-1">
          {player.moneyPile.map((card) => (
            <CardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerArea;
