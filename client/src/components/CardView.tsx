import React from "react";
import { Card, PropertyColor, CardType } from "../types";

interface CardViewProps {
  card: Card;
  clickable?: boolean;
  onClick?: () => void;
}

function CardView({ card, clickable, onClick }: CardViewProps) {
  const getColorClass = (color: PropertyColor) => {
    switch (color) {
      case PropertyColor.BROWN:
        return "from-amber-900";
      case PropertyColor.BLUE:
        return "from-blue-600";
      case PropertyColor.GREEN:
        return "from-green-600";
      case PropertyColor.YELLOW:
        return "from-yellow-400";
      case PropertyColor.RED:
        return "from-red-600";
      case PropertyColor.ORANGE:
        return "from-orange-500";
      case PropertyColor.PURPLE:
        return "from-purple-600";
      case PropertyColor.LIGHT_BLUE:
        return "from-sky-400";
      case PropertyColor.RAILROAD:
        return "from-gray-800";
      case PropertyColor.UTILITY:
        return "from-gray-600";
      default:
        return "from-gray-100";
    }
  };

  const getSecondColorClass = (color: PropertyColor) => {
    switch (color) {
      case PropertyColor.BROWN:
        return "to-amber-900";
      case PropertyColor.BLUE:
        return "to-blue-600";
      case PropertyColor.GREEN:
        return "to-green-600";
      case PropertyColor.YELLOW:
        return "to-yellow-400";
      case PropertyColor.RED:
        return "to-red-600";
      case PropertyColor.ORANGE:
        return "to-orange-500";
      case PropertyColor.PURPLE:
        return "to-purple-600";
      case PropertyColor.LIGHT_BLUE:
        return "to-sky-400";
      case PropertyColor.RAILROAD:
        return "to-gray-800";
      case PropertyColor.UTILITY:
        return "to-gray-600";
      default:
        return "to-gray-100";
    }
  };

  const getBgColor = () => {
    if (card.type === "PROPERTY") {
      if (card.isWildcard) {
        return "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500";
      }
      if (card.color) {
        switch (card.color) {
          case PropertyColor.BROWN:
            return "bg-amber-900";
          case PropertyColor.BLUE:
            return "bg-blue-600";
          case PropertyColor.GREEN:
            return "bg-green-600";
          case PropertyColor.YELLOW:
            return "bg-yellow-400";
          case PropertyColor.RED:
            return "bg-red-600";
          case PropertyColor.ORANGE:
            return "bg-orange-500";
          case PropertyColor.PURPLE:
            return "bg-purple-600";
          case PropertyColor.LIGHT_BLUE:
            return "bg-sky-400";
          case PropertyColor.RAILROAD:
            return "bg-gray-800";
          case PropertyColor.UTILITY:
            return "bg-gray-600";
          default:
            return "bg-gray-100";
        }
      }
    }
    return "";
  };

  const getCardBg = () => {
    if (card.type === "MONEY") {
      return "bg-gradient-to-b from-emerald-100 to-emerald-50";
    }
    if (
      card.type === "RENT" &&
      card.rentColors &&
      card.rentColors.length === 2
    ) {
      return `${getColorClass(card.rentColors[0])} ${getSecondColorClass(
        card.rentColors[1]
      )}`;
    }
    return "bg-gradient-to-b from-gray-50 to-white";
  };

  const getTextColor = () => {
    if (card.type === CardType.PROPERTY) {
      if (card.isWildcard) {
        return "text-white";
      }
      if (card.color) {
        switch (card.color) {
          case PropertyColor.YELLOW:
            return "text-black";
          default:
            return "text-white";
        }
      }
    }
    return "text-black";
  };

  const getRentValues = (color: PropertyColor): number[] => {
    switch (color) {
      case PropertyColor.BROWN:
        return [1, 2];
      case PropertyColor.LIGHT_BLUE:
        return [1, 2, 3];
      case PropertyColor.PURPLE:
        return [1, 2, 4];
      case PropertyColor.ORANGE:
        return [1, 3, 5];
      case PropertyColor.RED:
        return [2, 3, 6];
      case PropertyColor.YELLOW:
        return [2, 4, 6];
      case PropertyColor.GREEN:
        return [2, 4, 7];
      case PropertyColor.BLUE:
        return [3, 8];
      case PropertyColor.RAILROAD:
        return [1, 2, 3, 4];
      case PropertyColor.UTILITY:
        return [1, 2];
      default:
        return [];
    }
  };

  const getActionEmoji = (name: string): string => {
    switch (name) {
      case "Deal Breaker":
        return "💔";
      case "Just Say No":
        return "🚫";
      case "Sly Deal":
        return "🦊";
      case "Forced Deal":
        return "🔄";
      case "Debt Collector":
        return "💰";
      case "It's My Birthday":
        return "🎂";
      case "Double The Rent":
        return "✨";
      case "House":
        return "🏠";
      case "Hotel":
        return "🏨";
      case "Pass Go":
        return "👉";
      default:
        return "❓";
    }
  };

  const getRentCircleColor = (color: PropertyColor): string => {
    switch (color) {
      case PropertyColor.BROWN:
        return "bg-amber-900";
      case PropertyColor.BLUE:
        return "bg-blue-600";
      case PropertyColor.GREEN:
        return "bg-green-600";
      case PropertyColor.YELLOW:
        return "bg-yellow-400";
      case PropertyColor.RED:
        return "bg-red-600";
      case PropertyColor.ORANGE:
        return "bg-orange-500";
      case PropertyColor.PURPLE:
        return "bg-purple-600";
      case PropertyColor.LIGHT_BLUE:
        return "bg-sky-400";
      case PropertyColor.RAILROAD:
        return "bg-gray-800";
      case PropertyColor.UTILITY:
        return "bg-gray-600";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div
      className={`
        relative border-2 rounded-xl w-20 h-28 flex flex-col overflow-hidden
        shadow-md transition-all duration-200 select-none text-center
        ${
          clickable
            ? "hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer"
            : ""
        }
        ${getCardBg()}
        ${getTextColor()}
        border-white/30
      `}
      onClick={clickable ? onClick : undefined}
    >
      {card.type === CardType.MONEY && (
        <div className="flex flex-col flex-1 items-center justify-center">
          <div className="text-2xl font-bold text-green-700 drop-shadow-sm">
            ${card.value}M
          </div>
        </div>
      )}

      {card.type === CardType.ACTION && (
        <div className="flex flex-col flex-1">
          <div className="text-xs font-bold mb-1 leading-tight drop-shadow-sm p-2">
            {card.name}
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-3xl">{getActionEmoji(card.name)}</div>
          </div>

          <div className="bg-emerald-100 py-1 text-center">
            <div className="text-sm font-bold text-green-700">
              ${card.value}M
            </div>
          </div>
        </div>
      )}

      {card.type === CardType.PROPERTY && (
        <>
          <div
            className={`w-full h-7 ${getBgColor()} px-1 pt-1 flex items-center justify-center`}
          >
            <div className="text-[10px] font-bold leading-tight text-white drop-shadow-sm">
              {card.name}
            </div>
          </div>

          <div className="flex flex-col flex-1 p-1.5 justify-between bg-white text-black">
            {!card.isWildcard && card.color && (
              <div className="text-[8px] space-y-0.5">
                {getRentValues(card.color).map((value, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span>
                      {index + 1} Card{index === 0 ? "" : "s"}
                    </span>
                    <span className="font-bold">${value}M</span>
                  </div>
                ))}
              </div>
            )}
            <div className="text-[10px] font-medium opacity-75 text-center">
              Value: ${card.value}M
            </div>
          </div>
        </>
      )}

      {card.type === CardType.RENT && (
        <div className="flex flex-col flex-1">
          <div className="text-xs font-bold mb-1 leading-tight drop-shadow-sm p-2">
            Rent
          </div>

          <div className="flex-1 flex items-center justify-center">
            {card.rentColors && card.rentColors.length === 2 && (
              <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-300 shadow-inner relative">
                <div className="flex h-full">
                  <div
                    className={`w-1/2 ${getRentCircleColor(
                      card.rentColors[0]
                    )}`}
                  ></div>
                  <div
                    className={`w-1/2 ${getRentCircleColor(
                      card.rentColors[1]
                    )}`}
                  ></div>
                </div>
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300/50"></div>
              </div>
            )}
          </div>

          <div className="bg-emerald-100 py-1 text-center">
            <div className="text-sm font-bold text-green-700">
              ${card.value}M
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardView;
