import React from "react";
import { Card } from "../types";

interface CardViewProps {
  card: Card;
  clickable?: boolean;
  onClick?: () => void;
}

function CardView({ card, clickable, onClick }: CardViewProps) {
  const getBgColor = () => {
    if (card.type === "PROPERTY") {
      if (card.isWildcard) {
        return "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500";
      }
      if (card.color) {
        switch (card.color) {
          case "Brown":
            return "bg-amber-900";
          case "Blue":
            return "bg-blue-600";
          case "Green":
            return "bg-green-600";
          case "Yellow":
            return "bg-yellow-400";
          case "Red":
            return "bg-red-600";
          case "Orange":
            return "bg-orange-500";
          case "Purple":
            return "bg-purple-600";
          case "LightBlue":
            return "bg-sky-400";
          case "Railroad":
            return "bg-gray-800";
          case "Utility":
            return "bg-gray-600";
          default:
            return "bg-gray-100";
        }
      }
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
          case "Yellow":
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
      <div className="text-xs font-bold mb-1 flex-1 leading-tight">{card.name}</div>

      <div className="mt-auto">
        {card.type === "MONEY" && (
          <div className="text-base font-bold text-green-700">{card.name}</div>
        )}
        {card.type === "PROPERTY" && (
          <div className="text-xs italic mb-0.5">
            {card.isWildcard ? "Wild Card" : card.color}
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
