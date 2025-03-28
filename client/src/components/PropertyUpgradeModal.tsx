import React from "react";
import { Player, Card, PropertySet, PropertyColor } from "../types";
import CardView from "./CardView";
import { getRequiredSetSize } from "../utils";

interface PropertyUpgradeModalProps {
  cardName: "House" | "Hotel";
  player: Player;
  onSelectPropertySet: (color: PropertyColor, setIndex: number) => void;
  onCancel: () => void;
  cardsPlayedThisTurn: number;
}

function PropertyUpgradeModal({
  cardName,
  player,
  onSelectPropertySet,
  onCancel,
  cardsPlayedThisTurn,
}: PropertyUpgradeModalProps) {
  // Calculate base rent for a property set
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

  // Calculate total rent for a property set including houses and hotels
  const calculateTotalRent = (
    color: PropertyColor,
    propertySet: PropertySet
  ): number => {
    const baseRent = calculateBaseRent(color, propertySet.cards.length);
    // Don't double the rent for complete sets
    let rent = baseRent;
    rent += propertySet.houses * 3;
    rent += propertySet.hotels * 4;
    return rent;
  };

  // Get all complete property sets
  type CompleteSet = {
    color: PropertyColor;
    propertySet: PropertySet;
    setIndex: number;
  };
  const completePropertySets: CompleteSet[] = [];

  Object.entries(player.properties).forEach(([color, propertySets]) => {
    const requiredSize = getRequiredSetSize(color as PropertyColor);
    propertySets.forEach((propertySet, index) => {
      if (propertySet.cards.length >= requiredSize) {
        completePropertySets.push({
          color: color as PropertyColor,
          propertySet,
          setIndex: index,
        });
      }
    });
  });

  // If no complete sets, show a message
  if (completePropertySets.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">{cardName}</h3>
          <p className="text-gray-700 mb-4">
            You don't have any complete property sets to add a{" "}
            {cardName.toLowerCase()} to.
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

  // Flag to show if this is the 3rd action
  const isThirdAction = cardsPlayedThisTurn === 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-4">
          Select a complete property set to add a {cardName.toLowerCase()} to
        </h3>

        {isThirdAction && (
          <div className="bg-blue-50 border-blue-200 border p-2 mb-4 rounded text-sm">
            This is your third action. Your turn will end after placing this{" "}
            {cardName.toLowerCase()}.
          </div>
        )}

        <div className="space-y-4 max-h-60 overflow-y-auto">
          {completePropertySets.map(({ color, propertySet, setIndex }) => (
            <div key={`${color}-${setIndex}`} className="border-b pb-3">
              <button
                className="w-full text-left p-2 hover:bg-gray-100 rounded"
                onClick={() => onSelectPropertySet(color, setIndex)}
              >
                <div className="flex justify-between mb-2">
                  <p className="font-medium">
                    {color} (Set {setIndex + 1})
                  </p>
                  <p className="text-sm">
                    Current Rent: ${calculateTotalRent(color, propertySet)}M
                    {cardName === "House" &&
                      ` → $${calculateTotalRent(color, {
                        ...propertySet,
                        houses: propertySet.houses + 1,
                      })}M`}
                    {cardName === "Hotel" &&
                      ` → $${calculateTotalRent(color, {
                        ...propertySet,
                        hotels: propertySet.hotels + 1,
                      })}M`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {propertySet.cards.map((card) => (
                    <div key={card.id}>
                      <CardView card={card} />
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  {propertySet.houses > 0 &&
                    `${propertySet.houses} House${
                      propertySet.houses > 1 ? "s" : ""
                    }`}
                  {propertySet.houses > 0 && propertySet.hotels > 0 && ", "}
                  {propertySet.hotels > 0 &&
                    `${propertySet.hotels} Hotel${
                      propertySet.hotels > 1 ? "s" : ""
                    }`}
                </div>
              </button>
            </div>
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

export default PropertyUpgradeModal;
