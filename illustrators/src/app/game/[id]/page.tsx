'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PixiCanvas from '../canvas';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
}

export default function GameRoomPage() {
  const params = useParams() as { id: string };
  const id = params.id;
  const router = useRouter();

  const [lobby, setLobby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState('');
  const socketRef = useRef<Socket | null>(null);

  // Prompt nickname once (guest or user)
  useEffect(() => {
    let storedName = localStorage.getItem('guestName');
    if (!storedName) {
      const input = prompt('Enter your nickname') || 'Guest';
      localStorage.setItem('guestName', input);
      storedName = input;
    }
    setPlayerName(storedName);
  }, []);

  // Boot socket server (required for Next.js SSR compatibility)
  useEffect(() => {
    fetch('/api/socket');
  }, []);

  // Connect to Socket.IO
  useEffect(() => {
    const socket = io(undefined, {
      path: '/api/socket/io',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);

      socket.emit('join', {
        id: socket.id,
        name: playerName,
      });
    });

    socket.on('gameStarted', () => {
      console.log('Game started from socket event');
      setLobby((prev: any) => ({ ...prev, gameStarted: true }));
    });

    socket.on('playerJoined', (player: Player) => {
      console.log('New player joined:', player);
      setLobby((prev: any) => ({
        ...prev,
        players: [...(prev.players || []), player],
      }));
    });

    socket.on('guessReceived', (guess: { guess: string; playerId: string }) => {
      setMessages((prev) => [...prev, `${guess.playerId}: ${guess.guess}`]);
    });

    socket.on('draw', (data) => {
      console.log('Drawing received:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [playerName]);

  // Poll lobby once
  useEffect(() => {
    async function fetchLobby() {
      try {
        const res = await fetch(`/api/lobby/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Lobby not found');
        const data = await res.json();
        setLobby(data);
      } catch (err) {
        console.error(err);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    }

    fetchLobby();
  }, [id, router]);

  // Host starts game
  const handleStartGame = async () => {
    await fetch(`/api/lobby/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameStarted: true }),
    });

    setLobby((prev: any) => ({ ...prev, gameStarted: true }));
    socketRef.current?.emit('startGame');
  };

  if (loading) return <p>Loading...</p>;
  if (!lobby) return <p>Lobby not found.</p>;


  // Add HTML here 
  // There is a waiting room (where host waits for players and starts game)
  // ^ "lobby.gameStarted"
  // Then the game starts when host clicks "Start"
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold text-indigo-600 mb-6">Lobby: {id}</h1>

      {!lobby.gameStarted ? (
        <>
          <p className="text-lg mb-2">Waiting for players...</p>
          <ul className="mb-4">
            {lobby.players?.map((p: Player, i: number) => (
              <li key={i}>
                {p.name === playerName ? (
                  <strong>{p.name} (You)</strong>
                ) : (
                  p.name
                )}
              </li>
            ))}
          </ul>

          <button
            onClick={handleStartGame}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
          >
            Start Game
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-4">Game Started!</h2>
          <div className="w-full h-[600px] border mb-6">
            <PixiCanvas socket={socketRef.current} />
          </div>

          <h3 className="text-lg font-semibold mb-2">Guesses:</h3>
          <ul className="text-left max-w-md">
            {messages.map((msg, idx) => (
              <li key={idx}>Msg{msg}</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
