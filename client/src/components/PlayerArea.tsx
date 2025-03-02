import React from "react";
import { Player, Card, PropertySet } from "../types";
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

  const calculateBaseRent = (color: string, count: number): number => {
    const baseRents: Record<string, number[]> = {
      Brown: [1, 2],
      LightBlue: [1, 2, 3],
      Purple: [1, 2, 4],
      Orange: [1, 3, 5],
      Red: [2, 3, 6],
      Yellow: [2, 4, 6],
      Green: [2, 4, 7],
      Blue: [3, 8],
      Railroad: [1, 2, 3, 4],
      Utility: [1, 2],
    };

    const rentIndex = Math.min(count, getRequiredSetSize(color)) - 1;
    const baseRent = baseRents[color][rentIndex];
    return baseRent;
  };

  const calculateTotalRent = (
    color: string,
    propertySet: PropertySet
  ): number => {
    const baseRent = calculateBaseRent(color, propertySet.cards.length);
    // Don't double for complete sets - base rent is all we need
    let rent = baseRent;
    rent += propertySet.houses * 3;
    rent += propertySet.hotels * 4;
    return rent;
  };

  const getCompletedSetCount = (): number => {
    let completedSets = 0;
    for (const color in player.properties) {
      const requiredSize = getRequiredSetSize(color);
      if (player.properties[color].cards.length >= requiredSize) {
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
            const propertySet = player.properties[color];
            if (!propertySet?.cards.length) return null;

            const requiredSize = getRequiredSetSize(color);
            const isComplete = propertySet.cards.length >= requiredSize;
            const currentRent = calculateTotalRent(color, propertySet);

            return (
              <div key={color} className="flex-shrink-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span
                    className={`text-xs ${
                      isComplete
                        ? "text-green-600 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    {color} ({propertySet.cards.length}/{requiredSize})
                  </span>
                  <span className="text-xs text-blue-600 font-medium ml-2">
                    ${currentRent}M
                  </span>
                </div>
                <div className="flex gap-0.5 relative">
                  {propertySet.cards.map((card: Card) => (
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
                  {(propertySet.houses > 0 || propertySet.hotels > 0) && (
                    <div className="absolute -top-2 -right-2 bg-white px-1 rounded-full shadow border text-xs flex items-center gap-0.5">
                      {propertySet.houses > 0 && (
                        <span className="text-green-600" title="Houses">
                          🏠×{propertySet.houses}
                        </span>
                      )}
                      {propertySet.hotels > 0 && (
                        <span className="text-red-600" title="Hotels">
                          🏨×{propertySet.hotels}
                        </span>
                      )}
                    </div>
                  )}
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
