import React from "react";
import { Player, Card } from "../types";
import CardView from "./CardView";

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer?: boolean;
  onWildCardClick?: (card: Card) => void;
  canReassignWildCard?: boolean;
}

function PlayerArea({
  player,
  isCurrentPlayer,
  onWildCardClick,
  canReassignWildCard,
}: PlayerAreaProps) {
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

  const getRequiredSetSize = (color: string): number => {
    switch (color) {
      case "Brown":
      case "Blue":
      case "Utility":
        return 2;
      case "Railroad":
        return 4;
      default:
        return 3;
    }
  };

  const getCompletedSetCount = (): number => {
    let completedSets = 0;
    for (const color in player.properties) {
      const requiredSize = getRequiredSetSize(color);
      if (player.properties[color].length >= requiredSize) {
        completedSets++;
      }
    }
    return completedSets;
  };

  const handleCardClick = (card: Card) => {
    if (
      isCurrentPlayer &&
      canReassignWildCard &&
      card.isWildcard &&
      onWildCardClick
    ) {
      onWildCardClick(card);
    }
  };

  const completedSets = getCompletedSetCount();

  return (
    <div className="border rounded-lg p-2 flex-1 bg-white shadow-sm">
      <h3 className="font-bold text-lg border-b pb-1">
        {player.name} ({completedSets}/3)
      </h3>

      <div className="mt-2">
        <div className="text-sm font-semibold mb-1">Properties:</div>
        <div className="flex flex-wrap gap-2">
          {propertyOrder.map((color) => {
            const cards = player.properties[color] || [];
            if (cards.length === 0) return null;

            const requiredSize = getRequiredSetSize(color);
            const isComplete = cards.length >= requiredSize;

            return (
              <div key={color} className="flex-shrink-0">
                <div
                  className={`text-xs ${
                    isComplete
                      ? "text-green-600 font-semibold"
                      : "text-gray-600"
                  } mb-0.5`}
                >
                  {color} ({cards.length}/{requiredSize})
                </div>
                <div className="flex gap-0.5">
                  {cards.map((card: Card) => (
                    <div
                      key={card.id}
                      className={
                        isCurrentPlayer &&
                        canReassignWildCard &&
                        card.isWildcard
                          ? "cursor-pointer hover:scale-105 transition-transform"
                          : ""
                      }
                    >
                      <CardView
                        card={card}
                        clickable={
                          isCurrentPlayer &&
                          canReassignWildCard &&
                          card.isWildcard
                        }
                        onClick={() => handleCardClick(card)}
                      />
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
