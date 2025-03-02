import React from "react";
import { Card } from "../types";

interface CardViewProps {
  card: Card;
  clickable?: boolean;
  onClick?: () => void;
}

function CardView({ card, clickable, onClick }: CardViewProps) {
  return (
    <div
      className={`border rounded p-2 w-24 h-36 flex flex-col items-center justify-center cursor-pointer
        ${clickable ? "hover:bg-gray-200" : ""}
      `}
      onClick={clickable ? onClick : undefined}
    >
      <div className="text-sm font-bold">{card.name}</div>
      <div className="text-xs">{card.type}</div>
      {card.color && <div className="text-xs italic">{card.color}</div>}
      <div className="text-xl text-blue-600">{card.value}</div>
    </div>
  );
}

export default CardView;
