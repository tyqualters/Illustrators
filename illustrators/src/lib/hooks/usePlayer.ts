// helps with guest and logged in user handling
'use client';

import { useEffect, useState } from 'react';

// interface for player object (either a guest or an authenticated user)
interface Player {
  id: string;
  name: string;
}

// exported hook that any component can use to get the current plauyer and loading status
export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null); // this stores player info
  const [loading, setLoading] = useState(true); // this tracks loading state

  useEffect(() => {
    // attempts to fetch autenticated user session
    async function fetchPlayer() {
      try {
        // try to get user session from API
        const res = await fetch('/api/session', { cache: 'no-store' });
        if (res.ok) {
          // if session is valid, use it to set the player
          const user = await res.json();
          setPlayer({ id: user.id, name: user.name });
        } else {
          // if session is missing or invalid, fall back to guest mode
          fallbackToGuest();
        }
      } catch (err) {
        // if fetch fails (like offline), default to guest
        fallbackToGuest();
      } finally {
        setLoading(false); // finish loading no matter the outcome
      }
    }

    // sets player as a guest using localStorage
    function fallbackToGuest() {
      let guestId = localStorage.getItem('guestId');
      let guestName = localStorage.getItem('guestName') || 'Guest';

      // if no guest ID exists, create
      if (!guestId) {
        guestId = `guest-${crypto.randomUUID()}`;
        localStorage.setItem('guestId', guestId);
      }

      // store name if it is missing (typically from first visit or no refresh)
      if (!guestName) {
        localStorage.setItem('guestName', guestName);
      }

      // set the player using guest credentials
      setPlayer({ id: guestId, name: guestName });
    }

    // run once on mount to determine player identity
    fetchPlayer();
  }, []);

  return { player, loading };
}
