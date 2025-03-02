import React from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import ReactConfetti from "react-confetti";
import { socket } from "../services/socket";
import CardView from "../components/CardView";
import PlayerArea from "../components/PlayerArea";
import { ColorPicker } from "../components/ColorPicker";
import ActionCardModal from "../components/ActionCardModal";
import GameToast from "../components/GameToast";
import PropertyStealModal from "../components/PropertyStealModal";
import { GameState, Player, Card } from "../types";

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
      setSelectedActionCard(card);
      return;
    }

    // Play money cards directly
    socket.emit("playCard", roomId, playerId, card.id);
  };

  const handleColorPick = (color: string) => {
    if (selectedWildcard) {
      socket.emit("playCard", roomId, playerId, selectedWildcard.id, color);
      setSelectedWildcard(null);
    }
  };

  const handleWildCardClick = (card: Card) => {
    if (isMyTurn && !gameState.wildCardReassignedThisTurn) {
      setSelectedWildcardForReassign(card);
    }
  };

  const handleColorPickForReassign = (color: string) => {
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

  const handlePlayAsAction = () => {
    if (selectedActionCard) {
      socket.emit(
        "playCard",
        roomId,
        playerId,
        selectedActionCard.id,
        undefined,
        true
      );
      setSelectedActionCard(null);
    }
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

      {selectedActionCard && (
        <ActionCardModal
          card={selectedActionCard}
          onPlayAsMoney={handlePlayAsMoney}
          onPlayAsAction={handlePlayAsAction}
          onCancel={() => setSelectedActionCard(null)}
        />
      )}

      {/* Property Steal Modal */}
      {showPropertyStealModal && gameState && (
        <PropertyStealModal
          players={gameState.players}
          currentPlayerId={playerId}
          onSelectProperty={handlePropertySteal}
          onCancel={() => setShowPropertyStealModal(false)}
        />
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Game Room: {roomId}</h1>
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
                {!gameState.wildCardReassignedThisTurn && (
                  <div className="text-blue-600">
                    You can reassign one wild card's color this turn
                  </div>
                )}
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

          <div className="flex gap-4">
            {gameState.players.map((player) => (
              <PlayerArea
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === playerId}
                onWildCardClick={handleWildCardClick}
                canReassignWildCard={
                  isMyTurn && !gameState.wildCardReassignedThisTurn
                }
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
