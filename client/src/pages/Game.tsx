import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { socket } from "../services/socket";
import CardView from "../components/CardView";
import PlayerArea from "../components/PlayerArea";

function Game() {
  const { roomId } = useParams();
  const { state } = useLocation() as any;
  const [gameState, setGameState] = React.useState(state?.gameState || null);
  const [playerId, setPlayerId] = React.useState<string>("");
  const [myPlayer, setMyPlayer] = React.useState<any>(null);

  React.useEffect(() => {
    // On joining, we have an initial gameState from Lobby, but we need to
    // keep listening for updates:
    socket.on("roomJoined", (gs) => {
      setGameState(gs);
    });
    socket.on("updateGameState", (gs) => {
      setGameState(gs);
    });
    socket.on("error", (msg) => {
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
    // Identify which player is me. This is a naive approach:
    // We'll guess the last joined player's id might be in localStorage or something
    // but for simplicity, store it in a variable on creation/join.
    // If you can't track it, you might do a more robust approach.
    // In real usage, you'd store your playerId after "createRoom"/"joinRoom".
    // For example:
    // localStorage.getItem("playerId")
    // Or pass via navigation state.

    // This sample attempts to find if there's exactly 1 player that doesn't have a name mismatch...
    // This is a placeholder logic if you want to store your ID on client.
    // For simplicity we skip that. We'll set you to first player if missing.
    if (!playerId) {
      const firstPlayer = gameState.players[0]?.id || "";
      setPlayerId(firstPlayer);
    }

    const me = gameState.players.find((p: any) => p.id === playerId);
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
    ? gameState.players.find((p: any) => p.id === gameState.winnerId)
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
            {gameState.players.map((player: any) => (
              <PlayerArea key={player.id} player={player} />
            ))}
          </div>
          <div className="border p-2 mt-4">
            <h2 className="font-semibold">My Hand:</h2>
            <div className="flex gap-2">
              {myPlayer?.hand?.map((card: any) => (
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
            {gameState.players.map((player: any) => (
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
