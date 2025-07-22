'use client';

import { redirect, useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePlayer } from '@/lib/hooks/usePlayer';

export default function LobbyPage() {
  const [code, setCode] = useState('');
  const router = useRouter();
  const { player, loading, setPlayerName } = usePlayer();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!player?.name.trim()) {
      alert('Please enter a nickname');
      return;
    }

    if (!code.trim()) {
      alert('Please enter a lobby code');
      return;
    }

    // Check if lobby exists before redirecting
    const res = await fetch(`/api/lobby/${code}`);
    if (!res.ok) {
      alert('Lobby not found. Please check the code and try again.');
      return;
    }

    router.push(`/game/${code}`);
  };


  const handleGoHome = () => {
    redirect('/');
  }

  const handleCreate = async () => {
    if (!player?.name.trim()) {
      alert('Please enter a nickname');
      return;
    }

    const res = await fetch('/api/lobby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Untitled Lobby',
        players: [{ id: player.id, name: player.name.trim() }],
        createdAt: new Date().toISOString(),
        gameStarted: false,
        hostId: player.id,
      }),
    });

    const data = await res.json();
    if (res.ok && data._id) {
      router.push(`/game/${data._id}`);
    } else {
      alert('Failed to create lobby. Try again.');
      console.error('Create lobby error:', data);
    }
  };

  if (loading || !player) return <p className="text-center p-8">Checking session...</p>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">

      <div className="flex flex-col gap-2 w-full max-w-sm mb-6 bg-white p-3 rounded">
        <h1 className="text-4xl font-bold mb-6 text-blue-500">Join or Create a Lobby</h1>
        <input
          type="text"
          placeholder="Enter Your Nickname"
          value={player.name}
          onChange={(e) => setPlayerName(e.target.value)}
          className="border px-4 py-2 rounded"
        />

        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter Lobby Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 cursor-pointer"
          >
            Join Lobby
          </button>
        </form>

        <button
          onClick={handleCreate}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 cursor-pointer"
        >
          Create New Lobby
        </button>

        <button
          onClick={handleGoHome}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 cursor-pointer mt-5"
          >
            Return Home
          </button>
      </div>
    </main>
  );
}
