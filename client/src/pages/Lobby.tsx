import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";

function Lobby() {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    socket.on("roomJoined", (gameState) => {
      // navigate to game room
      navigate(`/game/${gameState.roomId}`, { state: { gameState } });
    });

    socket.on("error", (msg) => {
      alert(msg);
    });

    return () => {
      socket.off("roomJoined");
      socket.off("error");
    };
  }, [navigate]);

  const handleCreateRoom = () => {
    if (!playerName) {
      alert("Enter player name");
      return;
    }
    socket.emit("createRoom", playerName);
  };

  const handleJoinRoom = () => {
    if (!playerName || !roomId) {
      alert("Enter player name and room ID");
      return;
    }
    socket.emit("joinRoom", roomId, playerName);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-3xl font-bold">Monopoly Deal Lobby</h1>
      <input
        className="border p-2"
        type="text"
        placeholder="Your Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="bg-blue-500 text-white px-4 py-2"
          onClick={handleCreateRoom}
        >
          Create Room
        </button>
        <input
          className="border p-2"
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button
          className="bg-green-500 text-white px-4 py-2"
          onClick={handleJoinRoom}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

export default Lobby;
