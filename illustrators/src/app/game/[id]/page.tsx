'use client';

import { useEffect, useRef, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import GameCanvas from '../canvas';
import { getSocket } from '@/lib/socket';
import { usePlayer } from '@/lib/hooks/usePlayer';
import type { Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
}

export default function GameRoomPage() {
  const { id } = useParams() as { id: string };
  const { player, loading } = usePlayer();
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<{ playerId: string; text: string; isPrivate: boolean }[]>([]);
  const [correctGuessers, setCorrectGuessers] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<any>(null);
  const [wordConfirmed, setWordConfirmed] = useState(false);
  const [roundEnded, setRoundEnded] = useState<any>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hostId, setHostId] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetch('/api/socket');
  }, []);

  useEffect(() => {
    if (!player) return;
    const fetchLobby = async () => {
      const res = await fetch(`/api/lobby/${id}`);
      if (res.ok) {
        const data = await res.json();
        setHostId(data.hostId);
      }
    };
    fetchLobby();
  }, [id, player]);

  useEffect(() => {
    if (!player || loading) return;

    const setupSocket = async () => {
      await fetch('/api/socket'); // make sure server is ready

      const socket = getSocket();
      socketRef.current = socket;

      // setup all listeners before emitting anything
      socket.on('playersUpdated', (updatedList: Player[]) => {
        setPlayers(updatedList);
      });

      socket.on('gameStarted', () => {
        setGameStarted(true);
      });

      socket.on('game:turnStarted', (turnData) => {
        setGameStarted(true); // make sure that guest transitions too
        setCurrentTurn(turnData);
        setWordConfirmed(false);
        setRoundEnded(null);
        setCorrectGuessers([]);
        setMessages([]);
      });

      socket.on('drawer:wordConfirmed', () => {
        setWordConfirmed(true);
      });

      socket.on('game:roundEnded', (roundData) => {
        setRoundEnded(roundData);
      });

      socket.on('game:ended', () => {
        setGameEnded(true);
      });

      socket.on('guessReceived', ({ playerId, guess, result }) => {
        if (result === 'correct') {
          setCorrectGuessers((prev) => [...new Set([...prev, playerId])]);
        }
        const isPrivate = result === 'correct';
        setMessages((prev) => [...prev, { playerId, text: guess, isPrivate }]);
      });

      socket.on('chat', ({ playerId, text, isPrivate }) => {
        setMessages((prev) => [...prev, { playerId, text, isPrivate }]);
      });

      // only emit after .on('connect')
      socket.on('connect', () => {
        socket.emit('join', {
          id: player.id,
          name: player.name,
          lobbyId: id,
        });

        // immediately add the joining player locally (avoids "missing self" bug)
        setPlayers((prev) => {
          const exists = prev.some((p) => p.id === player.id);
          return exists ? prev : [...prev, { id: player.id, name: player.name }];
        });
      });
    };

    setupSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [player, loading, id]);

  const handleStartGame = async () => {
    if (players.length < 2) {
      alert('At least 2 players are required to start the game.');
      return;
    }
    await fetch(`/api/lobby/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameStarted: true }),
    });
    setGameStarted(true);
    socketRef.current?.emit('startGame', { lobbyId: id });
  };

  const handleWordSelect = (word: string) => {
    socketRef.current?.emit('drawer:wordSelected', { lobbyId: id, word });
  };

  const handleGoHome = () => {
    redirect('/');
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = e.currentTarget as HTMLFormElement;
    const guess = (input.elements.namedItem('guess') as HTMLInputElement).value.trim();
    if (!guess || socketRef.current?.id === currentTurn?.drawerId) return;

    socketRef.current?.emit('guess', {
      lobbyId: id,
      playerId: socketRef.current.id,
      guess,
    });

    input.reset();
  };

  const getName = (playerId: string) => players.find((p) => p.id === playerId)?.name ?? 'Unknown';
  const isDrawer = socketRef.current?.id === currentTurn?.drawerId;
  const canDraw = isDrawer && wordConfirmed;

  if (loading || !player) return <p>Loading...</p>;

  return (
    <main className="min-h-screen p-4 text-center">
      <h1 className="text-3xl font-bold text-indigo-600 mb-4 text-shadow-black text-shadow-2xs">Lobby: {id}</h1>

      {!gameStarted ? (
        <div className="bg-white border-1 border-black rounded-md p-2">
          <p className="text-lg mb-2">Waiting for players...</p>
          <ul className="mb-4">
            {players.map((p, i) => (
              <li key={i}>{p.name === player.name ? <strong>{p.name} (You)</strong> : p.name}</li>
            ))}
          </ul>
          <button
              onClick={handleGoHome}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 cursor-pointer m-2"
            >
              Go Back
            </button>
          {player.id === hostId && (
            <button
              onClick={handleStartGame}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 cursor-pointer m-2"
            >
              Start Game
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-row gap-4">
          <div className="w-1/5 text-left border p-2">
            <h3 className="font-bold mb-2">Players</h3>
            <ul>{players.map((p, i) => <li key={i}>{p.name}{p.name === player.name ? ' (You)' : ''}</li>)}</ul>
          </div>

          <div className="w-3/5">
            {gameEnded ? (
              <div className="text-xl font-bold text-red-500 mb-4">Game Over!</div>
            ) : (
              <>
                {currentTurn && (
                  <p className="mb-2 text-lg font-semibold">
                    Round {currentTurn.round} - Word: {_displayWord(currentTurn.word)}
                  </p>
                )}
                {isDrawer && !wordConfirmed && currentTurn?.wordOptions?.length > 0 && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
                      <h2 className="text-xl font-semibold mb-4">Choose a word to draw</h2>
                      <div className="flex flex-col gap-2">
                        {currentTurn.wordOptions.map((word: string) => (
                          <button key={word} onClick={() => handleWordSelect(word)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">{word}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="w-full h-[400px] border mb-6 relative">
                  <GameCanvas className="w-full h-full" socket={socketRef.current} isDrawing={canDraw} />
                  {!canDraw && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center pointer-events-none">
                      <p className="text-gray-700 font-semibold">Waiting for drawer...</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="w-1/5 border p-2 flex flex-col">
            <h3 className="font-bold mb-2">Guesses</h3>
            <div className="flex-grow overflow-y-auto text-left mb-2 border p-1 h-[300px]">
              <ul>
                {messages.map((msg, idx) => {
                  const isCorrect = correctGuessers.includes(msg.playerId);
                  const shouldShow = isDrawer || correctGuessers.includes(socketRef.current?.id!) === isCorrect;
                  return shouldShow ? (
                    <li key={idx}><strong>{getName(msg.playerId)}</strong>: {msg.text}</li>
                  ) : null;
                })}
              </ul>
            </div>
            {!isDrawer && (
              <form onSubmit={handleGuessSubmit}>
                <input type="text" name="guess" placeholder="Your guess"
                  className="w-full border p-2 rounded" autoComplete="off" />
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function _displayWord(word?: string): string {
  return word
    ? word.split('').map((char) => (/[a-zA-Z]/.test(char) ? '_' : char)).join(' ')
    : '';
}
