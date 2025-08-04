'use client';

import { useEffect, useRef, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import GameCanvas from '../canvas';
import { getSocket } from '@/lib/socket';
import { usePlayer } from '@/lib/hooks/usePlayer';
import type { Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { canSeeMessage } from '@/lib/gameLoop/utils/chat';
import { GameSettings } from '@/lib/gameLoop/state/gameState';
import Link from 'next/link';
import ProfilePicture from '@/app/components/ProfilePicture';
import RotateScreen from '@/app/components/RotateScreen/RotateScreen';


import './GameRoomPage.css'
import WipeTransition from '@/app/components/WipeTransition/WipeTransition';



interface Player {
  id: string;
  name: string;
}

interface TurnData {
  round: number;
  drawerId: string;
  word?: string;
  wordOptions?: string[];
  timer?: number;
  timerStart?: number;
  canvas?: string;
  scores?: Record<string, number>;
  wordSelectionDuration?: number;
}


interface RoundEndedData {
  roundScores: Record<string, number>;
  round?: number;
  totalScores: Record<string, number>;
}





// Local Game State
export default function GameRoomPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { player, loading } = usePlayer();
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<{ playerId: string; playerName: string; text: string; isPrivate: boolean }[]>([]);
  const [correctGuessers, setCorrectGuessers] = useState<string[]>([]);
  const [wordConfirmed, setWordConfirmed] = useState(false);

  const [currentTurn, setCurrentTurn] = useState<TurnData | null>(null);
  const [roundEnded, setRoundEnded] = useState<RoundEndedData | null>(null);
  const [initialCanvas, setInitialCanvas] = useState<string | null>(null); // or replace string with actual type if not just serialized

  const [gameEnded, setGameEnded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hostId, setHostId] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [redirectReady, setRedirectReady] = useState(false);
  const [totalScores, setTotalScores] = useState<Record<string, number>>({});
  const [lastScoredRound, setLastScoredRound] = useState<number>(0);
  const [wordSelectStart, setWordSelectStart] = useState<number | null>(null);
  const [wordSelectDuration, setWordSelectDuration] = useState<number>(15);
  const [wordSelectDurationLeft, setWordSelectDurationLeft] = useState<number>(wordSelectDuration);

  // new v
  const [settings, setSettings] = useState<GameSettings>({
    drawingTime: 90,
    totalRounds: 3,
    difficulty: 'medium',
  });

  const saveSettings = async () => {
    try {
      const res = await fetch(`/api/lobby/${id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        alert('Failed to save settings');
      } else {
        alert('Settings saved!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };
  // new ^

  // Fetches initial lobby info (e.g., host ID and game state)
  useEffect(() => {
    if (!player) return;
    const fetchLobby = async () => {
      const res = await fetch(`/api/lobby/${id}`);

      if (res.ok) {
        const data = await res.json();
        setHostId(data.hostId);

        // restores saved settings on refresh
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.gameStarted && !gameEnded) {
          setGameStarted(true);
        }
      }
    };
    fetchLobby();
  }, [id, player]);

  // Establishes socket connection and sets up all listeners
  useEffect(() => {
    if (!player || loading) return;

    const setupSocket = async () => {
      await fetch('/api/socket');
      const socket = getSocket();
      socketRef.current = socket;

      // Prevent duplicate listeners on re-renders
      socket.off('chat');
      socket.off('guessReceived');

      // Handle chat messages
      socket.on('chat', ({ playerId, playerName, text, isPrivate }) => {
        setMessages((prev) => [...prev, { playerId, playerName, text, isPrivate }]);
      });

      // Guess result handler (correct guess updates correctGuesseres)
      socket.on('guessReceived', ({ playerId, result }) => {
        if (result === 'correct') {
          setCorrectGuessers((prev) => [...new Set([...prev, playerId])]);
        }
      });

      // updates player list
      socket.on('playersUpdated', (updatedList: Player[]) => setPlayers(updatedList));

      // game started handler
      socket.on('gameStarted', ({ settings }) => {
        setGameStarted(true);
        setSettings(settings);
      });


      // new turn has begun
      socket.on('game:turnStarted', (turnData) => {
        setGameStarted(true);
        setCurrentTurn(turnData);
        setWordConfirmed(false);
        setRoundEnded(null);
        setCorrectGuessers([]);
        setMessages([]);
        setInitialCanvas(null); // ensures canvas resets each round


        // new v
        // Start word selection countdown timer
        const now = Date.now();
        const duration = turnData.wordSelectionDuration ?? 15;

        setWordSelectStart(now);
        setWordSelectDuration(duration);
        setWordSelectDurationLeft(duration); // bug fix
        // new ^
      });

      // Drawer confirmed word selection (update canvas + timer)
      socket.on('drawer:wordConfirmed', (turnData) => {
        setWordSelectStart(null); // stop word selection countdown
        setWordConfirmed(true);
        setCurrentTurn(turnData); // turnData includes word, drawerId, timer, etc.

        if (turnData.timer && turnData.timerStart) {
          const start = Number(turnData.timerStart);
          const now = Date.now();
          const elapsed = Math.floor((now - start) / 1000);
          const adjustedTimeLeft = Math.max(turnData.timer - elapsed, 0);
          setTimeLeft(adjustedTimeLeft);
        }


        if (turnData.canvas) {
          setInitialCanvas(turnData.canvas);
        }

        // Guessers immediately request the canvas after confirmation
        if (player?.id && turnData.drawerId && player.id !== turnData.drawerId) {
          console.log('[CLIENT] Guessing player requesting canvas (on wordConfirmed)');
          socket.emit('request-canvas');
        }
      });

      // Round ended: update scores and show scoreboard
      socket.on('game:roundEnded', (roundData) => {
        setRoundEnded(roundData);
        setTimeLeft(null);

        const roundNumber = roundData.round ?? currentTurn?.round ?? 0;

        if (roundNumber > lastScoredRound) {
          console.log('[CLIENT] Setting total scores from server:', roundData.totalScores);
          setTotalScores(roundData.totalScores); // backend-calculated score
          setLastScoredRound(roundNumber);
        }
      });


      // Handles game over: clean up local state and redirect to lobby page
      socket.on('game:ended', ({ finalScores }) => {
        setGameEnded(true);
        setGameStarted(false);
        setCurrentTurn(null);
        setCorrectGuessers([]);
        setMessages([]);
        setTimeLeft(null);
        setInitialCanvas(null);

        if (finalScores) {
          setTotalScores(finalScores); // overwrites without adding
        }

        // Delay countdown by 500ms so "Game Over" screen shows up first
        setTimeout(() => {
          setRedirectCountdown(30);

          countdownIntervalRef.current = setInterval(() => {
            setRedirectCountdown((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(countdownIntervalRef.current!);
                setRedirectReady(true); // triggers redirect safely
                return null;
              }
              return prev - 1;
            });
          }, 1000);

        }, 500);
      });

      // Resets local game state
      socket.on('restartGame', () => {
        setGameEnded(false);
        setGameStarted(false);
        setCurrentTurn(null);
        setCorrectGuessers([]);
        setMessages([]);
        setTimeLeft(null);
        setInitialCanvas(null);
      });


      // Player joins and requests canvas if needed
      socket.on('connect', () => {
        socket.emit('join', {
          id: player.id,
          name: player.name,
          lobbyId: id,
        });

        // Note: this may be redundant since 'playersUpdated' should handle this.
        setPlayers((prev) => {
          const exists = prev.some((p) => p.id === player.id);
          return exists ? prev : [...prev, { id: player.id, name: player.name }];
        });

        // Note: canvas request logic may fire state is set, think about delaying slightly
        // Ensure guesser fetches canvas after reconnect
        if (wordConfirmed && currentTurn && player?.id !== currentTurn.drawerId) {
          socket.emit('request-canvas');
        }
      });

      // Handles fallback case where player refreshes mid-round
      setTimeout(async () => {
        if (!currentTurn || !currentTurn.drawerId) {
          try {
            const res = await fetch(`/api/lobby/${id}/turn`);
            if (res.ok) {
              const turn = await res.json();
              if (turn?.drawerId) {
                setGameStarted(true);
                if (turn.word) setWordConfirmed(true);
                if (turn.canvas) setInitialCanvas(turn.canvas);
                setCurrentTurn(turn);

                // Recalculates time left from "timerStart"
                if (turn.timer && turn.timerStart) {
                  const start = Number(turn.timerStart);
                  const now = Date.now();
                  const elapsed = Math.floor((now - start) / 1000);
                  const adjustedTimeLeft = Math.max(turn.timer - elapsed, 0);
                  setTimeLeft(adjustedTimeLeft);
                }
              }
            }
          } catch (err) {
            console.error('Fallback fetch failed:', err);
          }
        }
      }, 300); // delay slightly to allow any socket events first
    };

    setupSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [player, loading, id]);


  // Triggers redirect back to lobby after game ends
  useEffect(() => {
    if (redirectReady) {
      router.push('/lobby');
    }
  }, [redirectReady, router]);

  /**
   * Synced countdown timer based on Redis "timerStart".
   * 
   * This effect recalculates time left every second by comparing the current time
   * to the timer start timestamp from Redis (sent via socket or API).
   * 
   * This avoids relying solely on local "setInterval" drift and ensures:
   * - accurate countdowns across clients
   * - consistent timer even after tab switches, refreshes, or re-renders
   * - alignment with server-side round timers
   * 
   * The countdown stops automatically when timeLeft reaches 0.
   */
  useEffect(() => {
    if (!currentTurn?.timerStart || timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      const start = Number(currentTurn.timerStart);
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const syncedTimeLeft = Math.max((currentTurn.timer ?? 90) - elapsed, 0);
      setTimeLeft(syncedTimeLeft);
    }, 1000); // Sync every second

    return () => clearInterval(interval);
  }, [currentTurn?.timerStart, currentTurn?.timer, timeLeft]);

  // Live countdown. Forces the UI to re-render every second while the drawer is choosing.
  useEffect(() => {
    if (!wordSelectStart || wordConfirmed) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - wordSelectStart) / 1000);
      const remaining = Math.max(wordSelectDuration - elapsed, 0);

      setWordSelectDurationLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [wordSelectStart, wordSelectDuration, wordConfirmed]);

  // Automatically hide the round score after 3 seconds
  useEffect(() => {
    if (roundEnded) {
      const timer = setTimeout(() => {
        setRoundEnded(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [roundEnded]);

  /**
   * Starts the game and notifies the server.
   * 
   * Ensures minimum player requirement is met, emits the
   * start event to the server, and resets all local score tracking.
   */
  const handleStartGame = async () => {
    if (players.length < 2) {
      alert('At least 2 players are required to start the game.');
      return;
    }

    // Reset total scores before starting
    setTotalScores({});

    await fetch(`/api/lobby/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameStarted: true }),
    });
    setGameStarted(true);
    socketRef.current?.emit('startGame', { lobbyId: id });
  };

  /**
   * Called when the "Return to Lobby" button is clicked on "Game Over" screen.
   * 
   * It stops redirect countdown, clears scores, and sends player back to
   * the lobby page.
   */
  const handleReturnToLobby = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Reset scores if needed 
    setTotalScores({});

    router.push('/lobby');
  };

  /**
   * Triggered when the drawer selects a word.
   * 
   * It sends the selected word to the server and the server then 
   * confirms and notifies all players.
   */
  const handleWordSelect = (word: string) => {
    if (socketRef.current) {
      socketRef.current?.emit('drawer:wordSelected', { lobbyId: id, word });
    } else {
      console.error('Socket is not current');
    }
  };

  const handleGoHome = () => {
    redirect('/lobby');
  };

  /**
   * Handles guess form submission.
   * 
   * This prevents form default behavior, ignores invalid, blank, or drawer guesses, and
   * sends guess to server.
   * 
   * Note: also blocks further guesses from correct players
   */
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = e.currentTarget as HTMLFormElement;
    const guess = (input.elements.namedItem('guess') as HTMLInputElement).value.trim();
    if (
      !guess ||
      socketRef.current?.id === currentTurn?.drawerId ||
      !player || correctGuessers.includes(player.id)
    ) {
      return;
    }

    socketRef.current?.emit('guess', {
      lobbyId: id,
      playerId: player?.id,
      guess,
    });

    input.reset();
  };

  /**
   * Helper to display a player's name from their ID. 
   * Falls back to "Unknown" if the player has disconnected.
   */
  const getName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name ?? 'Unknown';

  if (loading || !player) return <p>Loading...</p>;

  const isDrawer = player?.id === currentTurn?.drawerId;
  const hasGuessedCorrectly = correctGuessers.includes(player.id);

  const canDraw = isDrawer && wordConfirmed;
  const shouldShowCanvas = gameStarted && currentTurn && !roundEnded;

  return (
    <>

      <RotateScreen/>
      <WipeTransition> </WipeTransition>

      <main className="p-4 text-center">



        {gameEnded ? (
          <div className="   flex flex-row gap-4">
            {/* Players column */}
            <div className="formProperties w-1/5 text-left border p-2 bg-white rounded">
              <h4 className=" mt-4 text-white font-semibold">Players</h4>
              <ul>
                {[...players]
                  .sort((a, b) => (totalScores[b.id] ?? 0) - (totalScores[a.id] ?? 0))
                  .map((p, index) => {
                    const isYou = p.id === player.id;
                    return (
                      <li
                        key={p.id}
                        className={isYou ? 'text-indigo-500' : 'text-red-500'}
                      >
                        <Link href={`/profile/${p.id}`} target="_blank"><ProfilePicture userId={p.id} size={32} className="inline-block mr-3" />
                          #{index + 1} {p.name}{isYou ? ' (You)' : ''}: {totalScores[p.id] ?? 0
                          } pts
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Game Over panel */}
            <div className="w-3/5">
              <div className="formProperties p-4 bg-white border rounded shadow text-left mb-4">
                <h2 className="text-xl font-bold text-red-500 mb-2">Game Over. See you again soon!</h2>
                <ol className="list-decimal pl-4 text-white">
                  {[...players]
                    .sort((a, b) => (currentTurn?.scores?.[b.id] ?? 0) - (currentTurn?.scores?.[a.id] ?? 0))
                    .map((p) => (
                      <li key={p.id} className='text-white'><Link href={`/profile/${p.id}`} target="_blank">
                        <ProfilePicture userId={p.id} size={32} className="inline-block mr-3" />
                        {p.name}: {totalScores[p.id] ?? 0} pts
                      </Link>
                      </li>
                    ))}
                </ol>

                {redirectCountdown !== null && (
                  <p className="text-sm italic text-white mt-2">
                    Returning to lobby in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}
                  </p>
                )}

                {player.id && (
                  <button
                    onClick={handleReturnToLobby}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Return to Lobby
                  </button>
                )}
              </div>
            </div>

            {/* Empty column to keep layout */}
            <div className="w-1/5" />
          </div>
        ) : !gameStarted ? (
          <div>

            <div className='loading'>
              <p className="text-lg mb-2 text-white">Waiting for players</p>
              <div></div>
              <div></div>
              <div></div>
            </div>

            <ul className="border rounded border-blue-300 mb-4">
              {players.map((p, i) => (
                <li key={i} className="text-white">
                  <ProfilePicture userId={p.id} size={32} className="inline-block mr-3" />
                  {p.name === player.name ? (
                    <strong>{p.name} (You)</strong>
                  ) : (
                    p.name
                  )}

                </li>
              ))}
            </ul>
            <div className='LobbyCodeText flex items-center justify-center' >
              <h1 className="text-base md:text-3xl m-5 w-1/2 font-bold text-indigo-600 mb-4 rounded border border-blue-300 placeholder-blue-400 focus:border-blue-400">Lobby (Copy to join): {id}</h1>
            </div>

            {player.id === hostId && (
              <div className="text-left border formProperties bg-black w-9/10 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6">
                <h3 className="font-bold text-lg mb-2 text-white">Game Settings</h3>


                <label className="block mb-2 text-white">
                  Rounds (min 3, max 6):
                  <input
                    type="number"
                    min={3}
                    max={6}
                    step={1}
                    value={settings.totalRounds}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        totalRounds: Math.max(3, Math.min(6, Number(e.target.value))),
                      })
                    }
                    className="w-full border px-2 py-1 rounded border-blue-300 placeholder-blue-400 focus:border-blue-400"
                  />
                </label>



                <label className="block mb-2 text-white">
                  Drawing Time (seconds, min 30, max 180):
                  <input
                    type="number"
                    min={30}
                    max={180}
                    step={5}
                    value={settings.drawingTime}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        drawingTime: Math.max(30, Math.min(180, Number(e.target.value))),
                      })
                    }
                    className="w-full border px-2 py-1 rounded border-blue-300 placeholder-blue-400 focus:border-blue-400"
                  />
                </label>

                <label className="block mb-2 text-white">
                  Difficulty:
                  <select
                    value={settings.difficulty}
                    onChange={(e) => setSettings({ ...settings, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full border px-2 py-1 rounded border-blue-300 placeholder-blue-400 focus:border-blue-400"
                  >
                    <option value="easy" className="text-black">Easy</option>
                    <option value="medium" className="text-black">Medium</option>
                    <option value="hard" className="text-black">Hard</option>
                  </select>
                </label>
                <h3 className="font-bold text-sm mb-2 text-white">*Save Settings before starting game*</h3>

                <div className=" justify-center mt-4">
                  <button
                    onClick={saveSettings}
                    className="text-white w-full px-6 py-2  rounded-xl bg-indigo-600 hover:bg-indigo-700   mr-2 m-2"
                  >
                    Save Settings
                  </button>

                  <button
                    onClick={handleStartGame}
                    className="text-white px-6 py-3 w-full  rounded-xl bg-yellow-600 hover:bg-yellow-700 m-2"
                  >
                    Start Game
                  </button>

                  <button
                    onClick={handleGoHome}
                    className="w-full text-white px-6 py-2  rounded-xl bg-indigo-600 hover:bg-indigo-700 m-2"
                  >
                    Go Back
                  </button>


                </div>



              </div>

            )}



          </div>
        ) : (
          <div className="flex flex-row gap-4">
            {/* Players column */}


            <div className=" formProperties w-1/5 text-left border p-2 bg-white rounded-2xl">

              <h4 className="mt-4 font-semibold text-white">Players</h4>
              <ul>
                {[...players]
                  .sort((a, b) => (currentTurn?.scores?.[b.id] ?? 0) - (currentTurn?.scores?.[a.id] ?? 0))
                  .map((p, index) => {
                    const isYou = p.id === player.id;
                    return (
                      <li
                        key={p.id}
                        className={isYou ? 'text-indigo-500' : 'text-orange-600'}
                      ><ProfilePicture userId={p.id} size={32} className="inline-block mr-3" />
                        #{index + 1} {p.name}{isYou ? ' (You)' : ''}: {totalScores[p.id] ?? 0} pts
                      </li>
                    );
                  })}
              </ul>


            </div>

            {/* Main canvas and game view */}
            <div className="w-3/5">
              {currentTurn && (
                <p className="mb-2 text-lg font-semibold text-white">
                  Round {currentTurn.round} - Word: {_displayWord(currentTurn.word, isDrawer || hasGuessedCorrectly)
                  }
                </p>
              )}

              {/* Countdown */}
              {!wordConfirmed && wordSelectStart && (
                <p className="text-lg font-semibold text-blue-500 mb-2">
                  Word selection ends in:{' '}
                  {wordSelectDurationLeft}s
                </p>
              )}

              {isDrawer && !wordConfirmed && (currentTurn?.wordOptions?.length ?? 0) > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="formProperties bg-black w-9/10 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6">
                    <h2 className="text-4xl font-bold mb-6 text-white text-center">Choose a word to draw</h2>
                    <div className="flex flex-col gap-2">
                      {currentTurn!.wordOptions?.map((word: string) => (
                        <button
                          key={word}
                          onClick={() => handleWordSelect(word)}
                          className="w-full text-white px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 mt-2"
                        >
                          {word}
                        </button>
                      ))}
                    </div>


                  </div>
                </div>
              )}

              {timeLeft !== null && !roundEnded && (
                <p className={`text-lg font-bold mb-1 ${timeLeft <= 10 ? 'text-red-700' : 'text-white'}`}>
                  Time Left: {timeLeft}s
                </p>

              )}

              {roundEnded && (
                <div className="formProperties mb-4 p-4 bg-[#F0F4FF] border border-[#5C9EFF] rounded-xl shadow text-left">
                  <h2 className="  text-lg font-bold text-white mb-2">Round Over!</h2>
                  {currentTurn && (
                <p className="mb-2 text-lg font-semibold text-white">
                The Word Was: <b><u> {_displayWord(currentTurn.word, isDrawer || hasGuessedCorrectly)}</u></b> 
                   
                </p>
              )}
                  <ul className="text-sm text-white">
                    {Object.entries(roundEnded.roundScores).map(([playerId, score]) => {
                      const name = getName(playerId);
                      return (
                        <li key={playerId}>
                          {name}: +{Number(score)} points
                        </li>
                      );
                    })}
                  </ul>

                  <p className="mt-2 text-sm italic text-white">Next round starting...</p>
                </div>
              )}

              {shouldShowCanvas && (
                <div className="w-full h-[400px] border mb-6 relative">
                  <GameCanvas
                    className="w-full h-full bg-white"
                    socket={socketRef.current ?? undefined}
                    isDrawing={canDraw}
                    loadCanvasData={initialCanvas ?? undefined}
                    onCanvasReady={() => {
                      if (!canDraw && socketRef.current) {
                        console.log('[GUESSER] Canvas ready — emitting request-canvas');
                        socketRef.current.emit('request-canvas');
                      }
                    }}
                  />
                  {!wordConfirmed && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center pointer-events-none">
                      <p className="text-2xl text-white font-semibold">Waiting for drawer to choose a word...</p>
                    </div>
                  )}

                  <h1 className="text-3xl font-bold text-indigo-600 mb-4">Lobby: {id}</h1>
                </div>
              )}
            </div>

            {/* Guess/chat box */}
            <div className="formProperties w-1/5 border p-2 flex flex-col bg-white rounded">
              <h3 className="font-bold mb-2 text-white">Guesses</h3>
              <div className="flex-grow overflow-y-auto text-left mb-2 border text-white border-white p-1 h-[300px]">
                <ul>
                  {messages.map((msg, idx) => {
                    const isSystemMessage = msg.playerId === '__SYSTEM__';

                    if (!canSeeMessage({ msg, youId: player.id, isDrawer, correctGuessers })) return null;

                    return (
                      <li key={idx}>
                        {isSystemMessage ? (
                          <span
                            className={
                              msg.text.includes('guessed the word!')
                                ? 'text-green-600 font-semibold'
                                : msg.text.includes("You're close!")
                                  ? 'text-yellow-600 font-semibold'
                                  : 'text-gray-500 italic'
                            }
                          >
                            {msg.text}
                          </span>
                        ) : (
                          <span>
                            <strong>{msg.playerName || getName(msg.playerId)}</strong>: {msg.text}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {!isDrawer && (
                <form onSubmit={handleGuessSubmit} className="bg-white">
                  <input
                    type="text"
                    name="guess"
                    placeholder="Your guess"
                    className="w-full border p-2 rounded"
                    autoComplete="off"
                  />
                </form>
              )}
            </div>
          </div>

        )}
      </main>

    </>
  );
}

function _displayWord(word?: string, reveal = false): string {
  if (!word) return '';
  return reveal
    ? word
    : word
      .split('')
      .map((char) => (/[a-zA-Z]/.test(char) ? '_' : char))
      .join(' ');
}
