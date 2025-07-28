/**  
 * Location: src/lib/hooks/usePlayer.ts
 * 
 * Custom React Hook: usePlayer
 * 
 * Purpose: 
 * This hook fetches and returns the current player's ID and name, supporting
 * both authenticated users (through session cookie) and guest users (through local
 * storage). It handles the logic so that components using it don't need to worry
 * about whether the user is logged in or not.
 * 
 * Used in:
 * - lobby page
 * - game room page
 * - any other place that needs the current player identity (ID and name)
 * 
 * Returns: 
 * - player: { id, name } or null if not loaded yet
 * - loading: true while determining the plauer, then false
 */

// https://react.dev/learn/reusing-logic-with-custom-hooks

'use client';

import { useEffect, useState } from 'react';
import GetRandomUUID from './getRandomUUID';

// Shared player shape for both guests and logged in users
interface Player {
  id: string;
  name: string;
}

export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch current player from session API
    async function fetchPlayer() {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' });
        if (res.ok) {
          const user = await res.json();
          // authenticated user found
          setPlayer({ id: user.id, name: user.name });
        } else {
          // fallback to guest if session is missing 
          await fallbackToGuest();
        }
      } catch (err) {
        // error means session likely invalid, fallback to guest
        await fallbackToGuest();
      } finally {
        setLoading(false);
      }
    }

    // Fallback guest login (stored in localStorage)
    async function fallbackToGuest() {
      let guestId = localStorage.getItem('guestId');
      const guestName = localStorage.getItem('guestName') || 'Guest';

      // if not guestId exists, generate one
      if (!guestId) {
        guestId = `guest-${await GetRandomUUID()}`;
        localStorage.setItem('guestId', guestId);
      }

      if (!guestName) {
        localStorage.setItem('guestName', guestName);
      }

      setPlayer({ id: guestId, name: guestName });
    }

    fetchPlayer();
  }, []);

  const setPlayerName = (newName: string) => {
  // only allow guest users to update their name
  const isGuest = player?.id?.startsWith('guest-');
  if (player && isGuest) {
    const updated = { ...player, name: newName };
    localStorage.setItem('guestName', newName);
    setPlayer(updated);
  }
  // To Do: 
  // If we want logged in user's to change their name, add API route 
  // will need to handle name change here too using API route
  // API route of something like "api/user/name/route.ts"
  // to change name, we will need a route anyways, whether thats a profile-info route
  // or just name change. 
};

  return { player, loading, setPlayerName };
}