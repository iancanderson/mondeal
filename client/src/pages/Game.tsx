import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { socket } from "../services/socket";
import CardView from "../components/CardView";
import PlayerArea from "../components/PlayerArea";
import { GameState, Player } from "../types";

function Game() {
  const { roomId } = useParams();
  const { state } = useLocation() as { state: { gameState: GameState } | null };
  const [gameState, setGameState] = React.useState<GameState | null>(
    state?.gameState || null
  );
  const [playerId, setPlayerId] = React.useState<string>("");
  const [myPlayer, setMyPlayer] = React.useState<Player | null>(null);

  React.useEffect(() => {
    socket.on("roomJoined", (gs: GameState) => {
      setGameState(gs);
    });
    socket.on("updateGameState", (gs: GameState) => {
      setGameState(gs);
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

  React.useEffect(() => {
    if (!gameState) return;
    if (!playerId) {
      const firstPlayer = gameState.players[0]?.id || "";
      setPlayerId(firstPlayer);
    }
    const me = gameState.players.find((p) => p.id === playerId);
    if (me) {
      setMyPlayer(me);
    }
  }, [gameState, playerId]);

  if (!roomId || !gameState) {
    return <div className="p-4">No Game State found. Return to Lobby.</div>;
  }

  const handleToggleReady = () => {
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
                  clickable={isMyTurn && !winner}
                  onClick={() => handlePlayCard(card.id)}
                />
              ))}
            </div>
          </div>
          {isMyTurn && !winner && (
            <button
              className="bg-blue-500 text-white px-4 py-2 mt-4"
              onClick={handleEndTurn}
            >
              End Turn
            </button>
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
