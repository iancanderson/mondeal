import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import ReactConfetti from "react-confetti";
import { socket } from "../services/socket";
import CardView from "../components/CardView";
import PlayerArea from "../components/PlayerArea";
import { ColorPicker } from "../components/ColorPicker";
import ActionCardModal from "../components/ActionCardModal";
import { GameState, Player, Card } from "../types";

function Game() {
  const { roomId } = useParams();
  const { state } = useLocation() as {
    state: { gameState: GameState; playerId: string } | null;
  };
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
    });

    return () => {
      socket.off("roomJoined");
      socket.off("updateGameState");
      socket.off("error");
    };
  }, []);

  // Update myPlayer whenever gameState changes, but maintain playerId
  React.useEffect(() => {
    if (!gameState || !playerIdRef.current) return;
    const me = gameState.players.find((p) => p.id === playerIdRef.current);
    if (me) {
      setMyPlayer(me);
    }
  }, [gameState]);

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

  const isMyTurn =
    gameState?.players[gameState.currentPlayerIndex]?.id === playerId;
  const winner = gameState?.winnerId
    ? gameState.players.find((p) => p.id === gameState.winnerId)
    : null;
  const canPlayMoreCards = gameState?.cardsPlayedThisTurn < 3;

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
              {!canPlayMoreCards && (
                <div className="text-amber-600 mb-2">
                  You've played the maximum of 3 cards this turn
                </div>
              )}
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleEndTurn}
              >
                End Turn
              </button>
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
