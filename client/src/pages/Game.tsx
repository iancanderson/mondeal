import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { socket } from "../services/socket";
import CardView from "../components/CardView";
import PlayerArea from "../components/PlayerArea";
import { GameState, Player } from "../types";

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
      console.log("updateGameState received, current playerId:", playerIdRef.current);
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

  const handlePlayCard = (cardId: string) => {
    socket.emit("playCard", roomId, playerId, cardId);
  };

  const handleEndTurn = () => {
    socket.emit("endTurn", roomId, playerId);
  };

  const isMyTurn =
    gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const winner = gameState.winnerId
    ? gameState.players.find((p) => p.id === gameState.winnerId)
    : null;
  const canPlayMoreCards = gameState.cardsPlayedThisTurn < 3;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Game Room: {roomId}</h1>
      {gameState.isStarted ? (
        <>
          <div className="my-4">
            <h2 className="font-semibold text-lg">
              Current Turn:{" "}
              {gameState.players[gameState.currentPlayerIndex].name}
            </h2>
            {isMyTurn && (
              <div className="text-sm text-gray-600">
                Cards played this turn: {gameState.cardsPlayedThisTurn}/3
              </div>
            )}
            {winner && (
              <div className="text-green-600 text-xl font-bold">
                Winner: {winner.name}
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {gameState.players.map((player) => (
              <PlayerArea key={player.id} player={player} />
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
                  onClick={() => handlePlayCard(card.id)}
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
                className="bg-blue-500 text-white px-4 py-2"
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
            className="bg-green-500 text-white px-4 py-2"
            onClick={handleToggleReady}
            disabled={!playerId}
          >
            {myPlayer?.isReady ? "Unready" : "Ready"}
          </button>
          <div className="mt-4">
            {gameState.players.map((player) => (
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
