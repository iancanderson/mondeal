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
    if (
      card.type === "RENT" &&
      card.rentColors &&
      card.rentColors.length === 2
    ) {
      return `bg-gradient-to-b ${getColorClass(
        card.rentColors[0]
      )} ${getSecondColorClass(card.rentColors[1])}`;
    }
    return card.type === "MONEY" ? "bg-emerald-100" : "bg-amber-50";
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
        border rounded-lg p-1 w-16 h-24 flex flex-col cursor-pointer text-xs
        ${
          clickable
            ? "hover:shadow-lg transform hover:scale-105 transition-transform"
            : ""
        }
        ${getBgColor()}
        ${getTextColor()}
      `}
      onClick={clickable ? onClick : undefined}
    >
      <div className="text-xs font-bold mb-1 flex-1 leading-tight">
        {card.name}
      </div>

      <div className="mt-auto">
        {card.type === "MONEY" && (
          <div className="text-base font-bold text-green-700">{card.name}</div>
        )}
        {card.type === "PROPERTY" && (
          <div className="text-xs italic mb-0.5">
            {card.isWildcard ? "Wild Card" : card.color}
          </div>
        )}
        {card.type === "RENT" && card.rentColors && (
          <div className="text-xs italic mb-0.5">
            {card.rentColors.join("/")} Rent
          </div>
        )}
        {card.type === "ACTION" && (
          <div className="text-xs italic mb-0.5">Action Card</div>
        )}
        <div className="text-xs">Value: ${card.value}M</div>
      </div>
    </div>
  );
}

export default CardView;
