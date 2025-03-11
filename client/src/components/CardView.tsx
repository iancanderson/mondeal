import React from "react";
import { Card, PropertyColor } from "../types";

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
      return `bg-gradient-to-b ${getColorClass(
        card.rentColors[0]
      )} ${getSecondColorClass(card.rentColors[1])}`;
    }
    return "bg-gradient-to-b from-gray-50 to-white";
  };

  const getTextColor = () => {
    if (card.type === "PROPERTY") {
      if (card.isWildcard) {
        return "text-white text-shadow";
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

  return (
    <div
      className={`
        relative border-2 rounded-xl w-20 h-28 flex flex-col overflow-hidden
        shadow-md transition-all duration-200 select-none
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
      {card.type === "PROPERTY" && (
        <div className={`w-full h-7 ${getBgColor()} px-1 pt-1`}>
          <div className="text-[10px] font-bold leading-tight text-white drop-shadow-sm">
            {card.name}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col flex-1 p-2 ${
          card.type !== "PROPERTY" ? "pt-2" : "pt-1"
        }`}
      >
        {card.type !== "PROPERTY" && (
          <div className="text-xs font-bold mb-1 leading-tight drop-shadow-sm">
            {card.name}
          </div>
        )}

        <div className="mt-auto">
          {card.type === "MONEY" && (
            <div className="text-base font-bold text-green-700 drop-shadow-sm">
              ${card.value}M
            </div>
          )}
          {card.type !== "MONEY" && (
            <div className="text-[10px] font-medium opacity-75">
              Value: ${card.value}M
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardView;
