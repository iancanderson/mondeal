import React, { useState } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import ReactConfetti from "react-confetti";
import { socket } from "../services/socket";
import CardView from "../components/CardView";
import PlayerArea from "../components/PlayerArea";
import { ColorPicker } from "../components/ColorPicker";
import ActionCardModal from "../components/ActionCardModal";
import GameToast from "../components/GameToast";
import PropertyStealModal from "../components/PropertyStealModal";
import DealBreakerModal from "../components/DealBreakerModal";
import RentModal from "../components/RentModal";
import JustSayNoModal from "../components/JustSayNoModal";
import PropertyUpgradeModal from "../components/PropertyUpgradeModal";
import ForcedDealModal from "../components/ForcedDealModal";
import DebtCollectorModal from "../components/DebtCollectorModal";
import BirthdayModal from "../components/BirthdayModal";
import DoubleRentModal from "../components/DoubleRentModal";
import DiscardModal from "../components/DiscardModal";
import { GameState, Player, Card, PropertyColor } from "../types";
import { getRequiredSetSize } from "../utils";

function Game() {
  const { roomId } = useParams();
  const { state } = useLocation() as {
    state: { gameState: GameState; playerId: string } | null;
  };
  const navigate = useNavigate();
  const [gameState, setGameState] = React.useState<GameState | null>(
    state?.gameState || null
  );
  const [playerId, setPlayerId] = React.useState<string>(state?.playerId || "");
  const [myPlayer, setMyPlayer] = React.useState<Player | null>(null);
  const playerIdRef = React.useRef(playerId);
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [selectedWildcard, setSelectedWildcard] = React.useState<Card | null>(
    null
  );
  const [selectedWildcardForReassign, setSelectedWildcardForReassign] =
    React.useState<Card | null>(null);
  const [selectedActionCard, setSelectedActionCard] =
    React.useState<Card | null>(null);
  const [notifications, setNotifications] = React.useState<string[]>([]);
  const [showPropertyStealModal, setShowPropertyStealModal] =
    React.useState(false);
  const [showDealBreakerModal, setShowDealBreakerModal] = React.useState(false);
  const [showRentModal, setShowRentModal] = React.useState(false);
  const [showJustSayNoModal, setShowJustSayNoModal] = React.useState(false);
  const [showPropertyUpgradeModal, setShowPropertyUpgradeModal] =
    React.useState<{
      cardId: string;
      type: "House" | "Hotel";
    } | null>(null);
  const [showForcedDealModal, setShowForcedDealModal] = React.useState(false);
  const [showDebtCollectorModal, setShowDebtCollectorModal] =
    React.useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showDoubleRentModal, setShowDoubleRentModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [selectedDoubleRentCard, setSelectedDoubleRentCard] =
    useState<Card | null>(null);

  // Add UI state for debt payment modal
  const [showDebtPaymentModal, setShowDebtPaymentModal] = useState(false);

  // Handle window resize for confetti
  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep the ref up to date with the latest playerId
  React.useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  React.useEffect(() => {
    socket.on(
      "roomJoined",
      (data: { gameState: GameState; playerId: string }) => {
        console.log("roomJoined received, playerId:", data.playerId);
        setGameState(data.gameState);
        setPlayerId(data.playerId);
      }
    );

    socket.on("updateGameState", (gs: GameState) => {
      console.log(
        "updateGameState received, current playerId:",
        playerIdRef.current
      );
      setGameState((prevState) => {
        // Preserve the same gameState reference if nothing changed
        if (JSON.stringify(prevState) === JSON.stringify(gs)) {
          return prevState;
        }
        return gs;
      });

      if (
        gs.pendingAction.type === "DOUBLE_RENT_PENDING" &&
        gs.players[gs.currentPlayerIndex].id === playerId
      ) {
        setShowDoubleRentModal(true);
      }

      // Show discard modal if it's our turn and we need to discard
      if (
        gs.pendingAction.type === "DISCARD_NEEDED" &&
        gs.pendingAction.playerId === playerId
      ) {
        setShowDiscardModal(true);
      }
    });

    socket.on("error", (msg: string) => {
      alert(msg);
      // If error indicates game ended, navigate back to lobby
      if (msg.includes("Game ended")) {
        navigate("/");
      }
    });

    socket.on("gameNotification", (message: string) => {
      setNotifications((prev) => [...prev, message]);
    });

    return () => {
      socket.off("roomJoined");
      socket.off("updateGameState");
      socket.off("error");
      socket.off("gameNotification");
    };
  }, [navigate]);

  // Update myPlayer whenever gameState changes, but maintain playerId
  React.useEffect(() => {
    if (!gameState || !playerIdRef.current) return;
    const me = gameState.players.find((p) => p.id === playerIdRef.current);
    if (me) {
      setMyPlayer(me);
    }
  }, [gameState]);

  // Check if we should show the property steal modal (when Sly Deal is pending)
  React.useEffect(() => {
    if (
      gameState?.pendingAction.type === "SLY_DEAL" &&
      gameState.pendingAction.playerId === playerId
    ) {
      setShowPropertyStealModal(true);
    } else {
      setShowPropertyStealModal(false);
    }
  }, [gameState?.pendingAction, playerId]);

  // Check if we should show the deal breaker modal
  React.useEffect(() => {
    if (
      gameState?.pendingAction.type === "DEAL_BREAKER" &&
      gameState.pendingAction.playerId === playerId
    ) {
      setShowDealBreakerModal(true);
    } else {
      setShowDealBreakerModal(false);
    }
  }, [gameState?.pendingAction, playerId]);

  // Check if we should show rent payment modal
  React.useEffect(() => {
    if (
      gameState?.pendingAction.type === "RENT" &&
      gameState.pendingAction.playerId !== playerId
    ) {
      setShowRentModal(true);
    } else {
      setShowRentModal(false);
    }
  }, [gameState?.pendingAction, playerId]);

  // Add effect to show Just Say No modal
  React.useEffect(() => {
    if (
      gameState?.pendingAction.type === "JUST_SAY_NO_OPPORTUNITY" &&
      gameState.pendingAction.playerId === playerId
    ) {
      setShowJustSayNoModal(true);
    } else {
      setShowJustSayNoModal(false);
    }
  }, [gameState?.pendingAction, playerId]);

  // Add effect to show modal when Debt Collector is pending
  React.useEffect(() => {
    if (
      gameState?.pendingAction.type === "DEBT_COLLECTOR" &&
      gameState.pendingAction.playerId === playerId
    ) {
      setShowDebtCollectorModal(true);
    } else {
      setShowDebtCollectorModal(false);
    }
  }, [gameState?.pendingAction, playerId]);

  // Add effect to show Birthday modal
  React.useEffect(() => {
    if (
      gameState?.pendingAction.type === "BIRTHDAY" &&
      gameState.pendingAction.remainingPayers.includes(playerId || "")
    ) {
      setShowBirthdayModal(true);
    } else {
      setShowBirthdayModal(false);
    }
  }, [gameState?.pendingAction, playerId]);

  // Add effect to show debt payment modal
  React.useEffect(() => {
    if (
      gameState?.pendingAction.type === "DEBT_COLLECTOR" &&
      "targetPlayerId" in gameState.pendingAction &&
      gameState.pendingAction.targetPlayerId === playerId
    ) {
      setShowDebtPaymentModal(true);
    } else {
      setShowDebtPaymentModal(false);
    }
  }, [gameState?.pendingAction, playerId]);

  if (!roomId || !gameState) {
    return <div className="p-4">No Game State found. Return to Lobby.</div>;
  }

  const handleToggleReady = () => {
    if (!playerId) return;
    socket.emit("toggleReady", roomId, playerId);
  };

  const handlePlayCard = (card: Card) => {
    if (card.type === "PROPERTY" && card.isWildcard) {
      setSelectedWildcard(card);
      return;
    }

    if (card.type === "ACTION") {
      if (card.name === "House" || card.name === "Hotel") {
        // Show property upgrade modal for House/Hotel cards
        setShowPropertyUpgradeModal({ cardId: card.id, type: card.name });
        return;
      }

      // Check if it's a Deal Breaker and if there are any complete sets to steal
      if (card.name === "Deal Breaker") {
        // Check if any player has a complete set
        const hasCompleteSet = gameState?.players.some((p) => {
          if (p.id === playerId) return false; // Skip current player
          return Object.entries(p.properties).some(([color, propertySets]) => {
            const requiredSize = getRequiredSetSize(color as PropertyColor);
            return propertySets.some((set) => set.cards.length >= requiredSize);
          });
        });

        if (!hasCompleteSet) {
          return; // Don't allow playing Deal Breaker if no complete sets exist
        }
      }

      setSelectedActionCard(card);
      return;
    }

    if (card.type === "RENT") {
      setSelectedActionCard(card);
      return;
    }

    if (card.name === "Double The Rent") {
      socket.emit("playCard", roomId, playerId, card.id, undefined, true);
      setSelectedActionCard(null);
      return;
    }

    // Play money cards directly
    socket.emit("playCard", roomId, playerId, card.id);
  };

  const handleColorPick = (color: PropertyColor) => {
    if (selectedWildcard) {
      socket.emit("playCard", roomId, playerId, selectedWildcard.id, color);
      setSelectedWildcard(null);
    }
  };

  const handleWildCardClick = (card: Card) => {
    if (isMyTurn) {
      setSelectedWildcardForReassign(card);
    }
  };

  const handleColorPickForReassign = (color: PropertyColor) => {
    if (selectedWildcardForReassign) {
      socket.emit(
        "reassignWildcard",
        roomId,
        playerId,
        selectedWildcardForReassign.id,
        color
      );
      setSelectedWildcardForReassign(null);
    }
  };

  const handlePlayAsAction = (color?: PropertyColor) => {
    if (!selectedActionCard) return;

    // Special handling for Forced Deal
    if (selectedActionCard.name === "Forced Deal") {
      socket.emit(
        "playCard",
        roomId,
        playerId,
        selectedActionCard.id,
        undefined,
        true
      );
      setSelectedActionCard(null);
      setShowForcedDealModal(true);
      return;
    }

    // Special handling for Debt Collector
    if (selectedActionCard.name === "Debt Collector") {
      socket.emit(
        "playCard",
        roomId,
        playerId,
        selectedActionCard.id,
        undefined,
        true
      );
      // Don't clear selectedActionCard yet - we need it for the debt collection
      setShowDebtCollectorModal(true);
      return;
    }

    // Play the card with the chosen color for rent cards, or without color for other actions
    socket.emit(
      "playCard",
      roomId,
      playerId,
      selectedActionCard.id,
      color,
      true
    );
    setSelectedActionCard(null);
  };

  const handlePlayAsMoney = () => {
    if (selectedActionCard) {
      socket.emit(
        "playCard",
        roomId,
        playerId,
        selectedActionCard.id,
        undefined,
        false
      );
      setSelectedActionCard(null);
    }
  };

  const handleEndTurn = () => {
    socket.emit("endTurn", roomId, playerId);
  };

  const handlePropertySteal = (targetPlayerId: string, cardId: string) => {
    if (!roomId || !playerId) return;

    socket.emit(
      "executePropertySteal",
      roomId,
      playerId,
      targetPlayerId,
      cardId
    );
    setShowPropertyStealModal(false);
  };

  const handleDealBreaker = (targetPlayerId: string, color: PropertyColor) => {
    if (!roomId || !playerId) return;

    socket.emit("executeDealBreaker", roomId, playerId, targetPlayerId, color);
    setShowDealBreakerModal(false);
  };

  const handleRentPayment = (paymentCardIds: string[]) => {
    if (!roomId || !playerId || !gameState) return;

    socket.emit("payRent", roomId, playerId, paymentCardIds);
    setShowRentModal(false);
  };

  const handleRentColorPick = (color: PropertyColor) => {
    if (selectedActionCard && selectedActionCard.type === "RENT") {
      socket.emit(
        "playCard",
        roomId,
        playerId,
        selectedActionCard.id,
        color,
        true
      );
      setSelectedActionCard(null);
    }
  };

  const handleJustSayNoResponse = (useJustSayNo: boolean) => {
    if (!roomId || !playerId || !gameState) return;
    socket.emit("respondToAction", roomId, playerId, useJustSayNo);
    setShowJustSayNoModal(false);
  };

  const handlePropertyUpgrade = (color: PropertyColor) => {
    if (!showPropertyUpgradeModal) return;

    socket.emit(
      "playCard",
      roomId,
      playerId,
      showPropertyUpgradeModal.cardId,
      color,
      true
    );
    setShowPropertyUpgradeModal(null);
  };

  const handleForcedDeal = (
    targetPlayerId: string,
    targetCardId: string,
    myCardId: string
  ) => {
    if (!roomId || !playerId) return;

    socket.emit(
      "executeForcedDeal",
      roomId,
      playerId,
      targetPlayerId,
      targetCardId,
      myCardId
    );
    setShowForcedDealModal(false);
  };

  const handleCollectDebt = (targetPlayerId: string) => {
    if (!roomId || !playerId || !selectedActionCard) return;

    // Then emit the collect debt action
    socket.emit("collectDebt", roomId, playerId, targetPlayerId);
    setShowDebtCollectorModal(false);
    // Now we can clear the selected action card
    setSelectedActionCard(null);
  };

  // Handle paying a birthday gift
  const handlePayBirthdayGift = (paymentCardIds: string[]) => {
    if (!roomId || !playerId) return;
    socket.emit("payBirthdayGift", roomId, playerId, paymentCardIds);
  };

  const handleDoubleRentCardSelect = (rentCardId: string) => {
    if (!roomId || !playerId || !gameState) return;

    const rentCard = myPlayer?.hand.find((c) => c.id === rentCardId);
    if (!rentCard || rentCard.type !== "RENT") return;

    setSelectedDoubleRentCard(rentCard);
    setShowDoubleRentModal(false);
  };

  const handleDoubleRentColorPick = (color: PropertyColor) => {
    if (!selectedDoubleRentCard || selectedDoubleRentCard.type !== "RENT")
      return;

    socket.emit(
      "playCard",
      roomId,
      playerId,
      selectedDoubleRentCard.id,
      color,
      true
    );
    setSelectedDoubleRentCard(null);
  };

  const handleDiscard = (cardIds: string[]) => {
    if (!roomId || !playerId || !gameState) return;
    socket.emit("discardCards", roomId, playerId, cardIds);
    setShowDiscardModal(false);
  };

  const handlePayDebt = (paymentCardIds: string[]) => {
    if (!roomId || !playerId) return;
    socket.emit("payDebt", roomId, playerId, paymentCardIds);
    setShowDebtPaymentModal(false);
  };

  const getRentCards = () => {
    return myPlayer?.hand.filter((card) => card.type === "RENT") || [];
  };

  const isMyTurn =
    gameState?.players[gameState.currentPlayerIndex]?.id === playerId;
  const winner = gameState?.winnerId
    ? gameState.players.find((p) => p.id === gameState.winnerId)
    : null;
  const canPlayMoreCards = gameState?.cardsPlayedThisTurn < 3;

  const removeNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4">
      {winner && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={1000}
          gravity={0.2}
        />
      )}

      {/* Display game notifications */}
      {notifications.map((message, index) => (
        <GameToast
          key={index}
          message={message}
          onClose={() => removeNotification(index)}
        />
      ))}

      {selectedWildcard && (
        <ColorPicker
          onColorPick={handleColorPick}
          onCancel={() => setSelectedWildcard(null)}
        />
      )}

      {selectedWildcardForReassign && (
        <ColorPicker
          onColorPick={handleColorPickForReassign}
          onCancel={() => setSelectedWildcardForReassign(null)}
        />
      )}

      {selectedActionCard ? (
        <ActionCardModal
          card={selectedActionCard}
          onPlayAsMoney={handlePlayAsMoney}
          onPlayAsAction={handlePlayAsAction}
          onCancel={() => setSelectedActionCard(null)}
        />
      ) : null}

      {/* Property Steal Modal */}
      {showPropertyStealModal && gameState && (
        <PropertyStealModal
          players={gameState.players}
          currentPlayerId={playerId}
          onSelectProperty={handlePropertySteal}
          onCancel={() => setShowPropertyStealModal(false)}
        />
      )}

      {/* Deal Breaker Modal */}
      {showDealBreakerModal && gameState && (
        <DealBreakerModal
          players={gameState.players}
          currentPlayerId={playerId}
          onSelectPropertySet={handleDealBreaker}
          onCancel={() => setShowDealBreakerModal(false)}
        />
      )}

      {/* Rent Payment Modal */}
      {showRentModal &&
        gameState &&
        gameState.pendingAction.type === "RENT" && (
          <RentModal
            pendingAction={gameState.pendingAction}
            currentPlayer={gameState.players[gameState.currentPlayerIndex]}
            targetPlayer={myPlayer!}
            onPayRent={handleRentPayment}
          />
        )}

      {/* Just Say No Modal */}
      {showJustSayNoModal &&
        gameState &&
        (() => {
          const pendingAction = gameState.pendingAction;
          if (pendingAction.type !== "JUST_SAY_NO_OPPORTUNITY") return null;

          const actionPlayer = gameState.players.find(
            (p) => p.id === pendingAction.sourcePlayerId
          );
          if (!actionPlayer) return null;

          return (
            <JustSayNoModal
              player={myPlayer!}
              actionPlayer={actionPlayer}
              pendingAction={pendingAction}
              onRespond={handleJustSayNoResponse}
            />
          );
        })()}

      {showPropertyUpgradeModal && myPlayer && (
        <PropertyUpgradeModal
          cardName={showPropertyUpgradeModal.type}
          player={myPlayer}
          onSelectPropertySet={handlePropertyUpgrade}
          onCancel={() => setShowPropertyUpgradeModal(null)}
          cardsPlayedThisTurn={gameState.cardsPlayedThisTurn}
        />
      )}

      {showForcedDealModal && gameState && (
        <ForcedDealModal
          players={gameState.players}
          currentPlayerId={playerId}
          onExecuteForcedDeal={handleForcedDeal}
        />
      )}

      {showDebtCollectorModal && gameState && (
        <DebtCollectorModal
          players={gameState.players}
          currentPlayerId={playerId}
          onCollectDebt={handleCollectDebt}
          onCancel={() => setShowDebtCollectorModal(false)}
        />
      )}

      {showBirthdayModal && gameState && (
        <BirthdayModal
          pendingAction={gameState.pendingAction}
          birthdayPlayer={
            gameState.players.find(
              (p) =>
                p.id ===
                (gameState.pendingAction.type === "BIRTHDAY"
                  ? gameState.pendingAction.playerId
                  : undefined)
            )!
          }
          targetPlayer={gameState.players.find((p) => p.id === playerId)!}
          onPayBirthdayGift={handlePayBirthdayGift}
        />
      )}

      {showDoubleRentModal && (
        <DoubleRentModal
          rentCards={getRentCards()}
          onSelectRentCard={handleDoubleRentCardSelect}
          onCancel={() => setShowDoubleRentModal(false)}
        />
      )}

      {selectedDoubleRentCard?.type === "RENT" && (
        <ColorPicker
          onColorPick={handleDoubleRentColorPick}
          onCancel={() => setSelectedDoubleRentCard(null)}
          availableColors={selectedDoubleRentCard.rentColors}
        />
      )}

      {showDiscardModal && myPlayer && (
        <DiscardModal cards={myPlayer.hand} onDiscard={handleDiscard} />
      )}

      {showDebtPaymentModal && gameState && (
        <RentModal
          pendingAction={gameState.pendingAction}
          currentPlayer={gameState.players[gameState.currentPlayerIndex]}
          targetPlayer={myPlayer!}
          onPayRent={handlePayDebt}
        />
      )}

      <div className="flex justify-end items-center mb-4">
        <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
          Back to Lobby
        </Link>
      </div>

      {gameState?.isStarted ? (
        <>
          <div className="my-4">
            <h2 className="font-semibold text-lg">
              Current Turn:{" "}
              {gameState.players[gameState.currentPlayerIndex].name}
            </h2>
            {isMyTurn && (
              <div className="text-sm text-gray-600">
                <div>
                  Cards played this turn: {gameState.cardsPlayedThisTurn}/3
                </div>
              </div>
            )}
            {winner && (
              <div className="text-green-600 text-xl font-bold text-center py-4 bg-green-50 rounded-lg my-4">
                🎉 Winner: {winner.name} 🎉
              </div>
            )}
          </div>

          {/* Add discard pile display */}
          {gameState.discardPile.length > 0 && (
            <div className="my-4 p-3 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Action Card Discard Pile:</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {gameState.discardPile.map((card, index) => (
                  <CardView key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}

          {/* Remove erroneous line and replace with Players heading */}
          <h2 className="text-xl font-semibold">Players</h2>

          <div className="flex gap-4">
            {gameState.players.map((player) => (
              <PlayerArea
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === playerId}
                onWildCardClick={handleWildCardClick}
                canReassignWildCard={isMyTurn}
              />
            ))}
          </div>
          <div className="border p-2 mt-4">
            <h2 className="font-semibold">My Hand:</h2>
            <div className="flex gap-2">
              {myPlayer?.hand?.map((card) => (
                <CardView
                  key={card.id}
                  card={card}
                  clickable={isMyTurn && !winner && canPlayMoreCards}
                  onClick={() => handlePlayCard(card)}
                />
              ))}
            </div>
          </div>
          {isMyTurn && !winner && (
            <div className="mt-4">
              {gameState.cardsPlayedThisTurn === 3 ? (
                <div className="text-green-600 mb-2">
                  You've played 3 cards this turn. The turn will pass
                  automatically.
                </div>
              ) : gameState.pendingAction.type !== "NONE" ? (
                <div className="text-blue-600 mb-2">
                  Complete your action to continue your turn.
                </div>
              ) : (
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={handleEndTurn}
                >
                  End Turn
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="my-4">
            <p>Waiting for all players to be ready...</p>
          </div>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleToggleReady}
            disabled={!playerId}
          >
            {myPlayer?.isReady ? "Unready" : "Ready"}
          </button>
          <div className="mt-4">
            {gameState?.players.map((player) => (
              <div key={player.id} className="border-b py-1">
                {player.name} - {player.isReady ? "Ready" : "Not Ready"}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Game;
