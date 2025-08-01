'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePlayer } from '@/lib/hooks/usePlayer';
 


export default function LobbyClient() {
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
    router.push('/');
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
    <> 
  
    <main className="bg-container flex items-center justify-center min-h-[75vh]">

     
      <div className="formProperties bg-black w-9/10 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6">
        <h1 className="text-4xl font-bold mb-6 text-white text-center">Join or Create a Lobby</h1>
        <input
          type="text"
          placeholder="Enter Your Nickname"
          value={player.name}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full border px-4 py-2 rounded-xl border-blue-300 placeholder-blue-400 text-white focus:border-blue-400"
        />
      
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter Lobby Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border px-4 py-2 rounded-xl border-blue-300 placeholder-blue-400 text-white focus:border-blue-400"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 mt-2"
          >
            Join Lobby
          </button>
        </form>

        <button
          onClick={handleCreate}
          className="w-full text-white px-6 py-3 font-semibold  rounded-xl bg-yellow-600 hover:bg-yellow-700 "
        >
          Create New Lobby
        </button>

        <button
          onClick={handleGoHome}
          className="w-full bg-blue-600 text-white px-6 py-2 font-semibold rounded-xl  bg-indigo-600 hover:bg-indigo-700 mt-1"
          >
            Return Home
          </button>
      </div>
    </main>

    </>
  );
}
