'use client';

export function getPlayer() {
  let name = localStorage.getItem('guestName');
  let id = localStorage.getItem('guestId');

  if (!name || !id) {
    name = prompt('Enter your name') || 'Guest';
    id = `guest-${crypto.randomUUID()}`;
    localStorage.setItem('guestName', name);
    localStorage.setItem('guestId', id);
  }

  return { name, id };
}
