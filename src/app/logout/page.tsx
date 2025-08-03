'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Logout page
 * @returns 
 */
export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/logout', { method: 'POST' }).then(() => {
      router.push('/');
    });
  }, [router]);

  return <p>Logging out...</p>;
}