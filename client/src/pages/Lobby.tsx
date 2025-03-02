import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { socket } from "../services/socket";
import { GameState, RoomInfo } from "../types";

// Local storage keys
const PLAYER_NAME_KEY = "monopolyDeal_playerName";
const PLAYER_UUID_KEY = "monopolyDeal_playerUUID";

function Lobby() {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem(PLAYER_NAME_KEY) || "";
  });

  const [playerUUID] = useState(() => {
    // Initialize UUID from local storage or create new one
    const existingUUID = localStorage.getItem(PLAYER_UUID_KEY);
    if (existingUUID) {
      return existingUUID;
    }
    const newUUID = uuidv4();
    localStorage.setItem(PLAYER_UUID_KEY, newUUID);
    return newUUID;
  });

  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on(
      "roomJoined",
      (data: { gameState: GameState; playerId: string }) => {
        if (playerName) {
          localStorage.setItem(PLAYER_NAME_KEY, playerName);
        }
        navigate(`/game/${data.gameState.roomId}`, { state: data });
      }
    );

    socket.on("availableRooms", (rooms: RoomInfo[]) => {
      setAvailableRooms(rooms);
    });

    socket.on("error", (msg: string) => {
      alert(msg);
    });

    socket.emit("requestRooms");

    return () => {
      socket.off("roomJoined");
      socket.off("availableRooms");
      socket.off("error");
    };
  }, [navigate, playerName]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) {
      alert("Enter player name");
      return;
    }
    localStorage.setItem(PLAYER_NAME_KEY, playerName);
    socket.emit("createRoom", { name: playerName, uuid: playerUUID });
  };

  const handleJoinRoom = (roomIdToJoin: string) => {
    if (!playerName) {
      alert("Enter player name");
      return;
    }
    localStorage.setItem(PLAYER_NAME_KEY, playerName);
    socket.emit("joinRoom", roomIdToJoin, {
      name: playerName,
      uuid: playerUUID,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Monopoly Deal Lobby
        </h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            className="w-full border p-2 mb-4 rounded"
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            onClick={handleCreateRoom}
          >
            Create New Room
          </button>
        </div>

        {availableRooms.length > 0 ? (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
            <div className="space-y-2">
              {availableRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{room.creatorName}'s Room</div>
                    <div className="text-sm text-gray-500">
                      Players: {room.playerCount}
                    </div>
                  </div>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    onClick={() => handleJoinRoom(room.roomId)}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No rooms available. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
