import React from "react";
import { Player, Card, PropertySet, CardType, PropertyColor } from "../types";
import CardView from "./CardView";
import { getRequiredSetSize } from "../utils";

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
    PropertyColor.BROWN,
    PropertyColor.LIGHT_BLUE,
    PropertyColor.PURPLE,
    PropertyColor.ORANGE,
    PropertyColor.RED,
    PropertyColor.YELLOW,
    PropertyColor.GREEN,
    PropertyColor.BLUE,
    PropertyColor.RAILROAD,
    PropertyColor.UTILITY,
  ];

  const calculateBaseRent = (color: PropertyColor, count: number): number => {
    const baseRents: Record<PropertyColor, number[]> = {
      [PropertyColor.BROWN]: [1, 2],
      [PropertyColor.LIGHT_BLUE]: [1, 2, 3],
      [PropertyColor.PURPLE]: [1, 2, 4],
      [PropertyColor.ORANGE]: [1, 3, 5],
      [PropertyColor.RED]: [2, 3, 6],
      [PropertyColor.YELLOW]: [2, 4, 6],
      [PropertyColor.GREEN]: [2, 4, 7],
      [PropertyColor.BLUE]: [3, 8],
      [PropertyColor.RAILROAD]: [1, 2, 3, 4],
      [PropertyColor.UTILITY]: [1, 2],
    };
    const rentIndex = Math.min(count, getRequiredSetSize(color)) - 1;
    const baseRent = baseRents[color][rentIndex];
    return baseRent;
  };

  const calculateTotalRent = (
    color: PropertyColor,
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
      const propertySets = player.properties[color as PropertyColor];
      const requiredSize = getRequiredSetSize(color as PropertyColor);

      // Count completed sets for this color
      for (const set of propertySets) {
        if (set.cards.length >= requiredSize) {
          completedSets++;
        }
      }
    }

    return completedSets;
  };

  // Helper function to check if a card is a wildcard property
  const isWildcard = (card: Card): boolean => {
    return card.type === CardType.PROPERTY && !!card.isWildcard;
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
            const propertySets = player.properties[color];
            if (!propertySets?.length) return null;
            const requiredSize = getRequiredSetSize(color);

            return (
              <div key={color} className="flex-shrink-0 flex flex-col gap-2">
                <div className="text-xs font-semibold text-gray-600">
                  {color}
                </div>

                {propertySets.map((propertySet, setIndex) => {
                  const isComplete = propertySet.cards.length >= requiredSize;
                  const currentRent = calculateTotalRent(color, propertySet);

                  return (
                    <div key={`${color}-set-${setIndex}`} className="mb-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <span
                          className={`text-xs ${
                            isComplete
                              ? "text-green-600 font-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          Set {setIndex + 1} ({propertySet.cards.length}/
                          {requiredSize})
                        </span>
                        <span className="text-xs text-blue-600 font-medium ml-2">
                          ${currentRent}M
                        </span>
                      </div>
                      <div className="flex gap-0.5 relative">
                        {propertySet.cards.map((card: Card) => (
                          <div key={card.id}>
                            <CardView
                              card={card}
                              numCards={propertySet.cards.length}
                              clickable={canReassignWildCard && card.isWildcard}
                              onClick={() =>
                                card.isWildcard && onWildCardClick(card)
                              }
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
