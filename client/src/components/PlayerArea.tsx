import React from "react";
import { Player, Card, PropertySet, CardType, PropertyColor } from "../types";
import CardView from "./CardView";
import { getRequiredSetSize } from "../utils";

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  onWildCardClick: (card: Card) => void;
  canReassignWildCard: boolean;
  isCurrentTurn?: boolean;
  cardsPlayedThisTurn?: number;
  onEndTurn?: () => void;
}

function PlayerArea({
  player,
  isCurrentPlayer,
  onWildCardClick,
  canReassignWildCard,
  isCurrentTurn,
  cardsPlayedThisTurn = 0,
  onEndTurn,
}: PlayerAreaProps) {
  const propertyOrder: PropertyColor[] = [
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

  const getCompletedSetCount = (): number => {
    let completedSets = 0;
    for (const [color, propertySets] of Object.entries(player.properties)) {
      if (!isPropertyColor(color)) continue;
      const requiredSize = getRequiredSetSize(color as PropertyColor);
      for (const set of propertySets) {
        if (set.cards.length >= requiredSize) {
          completedSets++;
        }
      }
    }
    return completedSets;
  };

  const calculateTotalRent = (
    color: PropertyColor,
    propertySet: PropertySet
  ): number => {
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

    const rentIndex =
      Math.min(propertySet.cards.length, getRequiredSetSize(color)) - 1;
    let rent = baseRents[color][rentIndex];
    rent += propertySet.houses * 3;
    rent += propertySet.hotels * 4;
    return rent;
  };

  // Helper function to check if a string is a valid PropertyColor
  const isPropertyColor = (color: string): color is PropertyColor => {
    return Object.values(PropertyColor).includes(color as PropertyColor);
  };

  const renderTurnArrows = () => {
    const remainingActions = 3 - (cardsPlayedThisTurn || 0);
    return Array.from({ length: remainingActions }, (_, i) => (
      <span key={i} className="text-2xl text-blue-500 mr-1">
        ➜
      </span>
    ));
  };

  return (
    <div className="border p-2 rounded bg-white shadow-sm w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCurrentTurn && renderTurnArrows()}
          <h3
            className={`font-semibold ${isCurrentTurn ? "text-blue-600" : ""}`}
          >
            {player.name}
            {isCurrentPlayer && " (You)"}
          </h3>
        </div>
        {isCurrentTurn && onEndTurn && (
          <button
            onClick={onEndTurn}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
          >
            End Turn
          </button>
        )}
      </div>

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
                        {propertySet.cards.map((card: Card) => {
                          const isPropertyCard =
                            card.type === CardType.PROPERTY;
                          const cardToRender =
                            isPropertyCard &&
                            "isWildcard" in card &&
                            card.isWildcard
                              ? { ...card, color: color as PropertyColor }
                              : card;
                          return (
                            <div key={card.id}>
                              <CardView
                                card={cardToRender}
                                numCards={propertySet.cards.length}
                                clickable={
                                  canReassignWildCard &&
                                  isPropertyCard &&
                                  "isWildcard" in card &&
                                  card.isWildcard
                                }
                                onClick={() =>
                                  isPropertyCard &&
                                  "isWildcard" in card &&
                                  card.isWildcard &&
                                  onWildCardClick(card)
                                }
                              />
                            </div>
                          );
                        })}
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
