'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '../components/Header.jsx'; 
import { usePlayer } from '@/lib/hooks/usePlayer';

export default function LobbyPage() {
  const [code, setCode] = useState('');
  const router = useRouter();
  const { player, loading } = usePlayer();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player?.name.trim()) {
      alert('Please enter a nickname');
      return;
    }

    router.push(`/game/${code}`);
  };

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

    <div className="background_image">
    <Header />
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-6 text-black">Join or Create a Lobby</h1>

      <div className="flex flex-col gap-2 w-full max-w-sm mb-6">
        <input
          type="text"
          placeholder="Enter Your Nickname"
          value={player.name}
          onChange={(e) => {
            const newName = e.target.value;
            localStorage.setItem('guestName', newName);
          }}
          className="border-3 border-black px-4 py-2 rounded placeholder-black text-black bg-gray-100"
        />

        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter Lobby Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border-3 border-black px-4 py-2 rounded placeholder-black text-black bg-gray-100"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700  cursor-pointer"
          >
            Join Lobby
          </button>
        </form>
      </div>

      <button
        onClick={handleCreate}
        className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 cursor-pointer"
      >
        Create New Lobby
      </button>
    </main>
    </div>
  );
}
