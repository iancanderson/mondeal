import React from "react";
import { Player, Card, ActionState } from "../types";
import CardView from "./CardView";

interface JustSayNoModalProps {
  player: Player;
  actionPlayer: Player;
  pendingAction: ActionState;
  onRespond: (useJustSayNo: boolean) => void;
}

function JustSayNoModal({
  player,
  actionPlayer,
  pendingAction,
  onRespond,
}: JustSayNoModalProps) {
  if (pendingAction.type !== "JUST_SAY_NO_OPPORTUNITY") return null;

  const hasJustSayNo = player.hand.some((card) => card.name === "Just Say No");

  // Create descriptive message based on the action type
  const getActionDescription = () => {
    switch (pendingAction.actionType) {
      case "DEAL_BREAKER":
        return "steal a complete property set";
      case "SLY_DEAL":
        return "steal a property card";
      case "RENT":
        return `charge you $${pendingAction.amount}M rent`;
      default:
        return "perform their action";
    }
  };

  const getMessage = () => {
    switch (pendingAction.actionType) {
      case "DEAL_BREAKER":
        return `${actionPlayer.name} is trying to steal your complete property set!`;
      case "SLY_DEAL":
        return `${actionPlayer.name} is trying to steal one of your properties!`;
      case "RENT":
        return `${actionPlayer.name} is trying to charge you $${pendingAction.amount}M in rent!`;
      case "FORCED_DEAL":
        return `${actionPlayer.name} is trying to force a property trade with you!`;
      case "DEBT_COLLECTOR":
        return `${actionPlayer.name} is trying to collect a $5M debt from you!`;
      default:
        return "An action is being played against you!";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Defend Against Action</h3>
        <p className="text-gray-700 mb-6">
          {actionPlayer.name} is attempting to {getActionDescription()}. You
          have a Just Say No card - would you like to use it to prevent this
          action?
        </p>

        {hasJustSayNo ? (
          <div className="space-y-4">
            <button
              onClick={() => onRespond(true)}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Use Just Say No
            </button>
            <button
              onClick={() => onRespond(false)}
              className="w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Allow Action
            </button>
          </div>
        ) : (
          <button
            onClick={() => onRespond(false)}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

export default JustSayNoModal;
