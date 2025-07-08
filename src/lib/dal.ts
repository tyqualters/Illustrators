// data access layer
// userId = session token field (represents authenticated user's ID)

import 'server-only'

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { decrypt } from '@/lib/session';
import User from '@/models/User';

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login');
  }
  return { isAuth: true, userId: session.userId };
})

// This just doesn't redirect
export const _verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    return false;
  }

  return true;
})

export const getUser = cache(async () => {
  const session = await verifySession()
  if (!session) return null

  try {
    const data = await User.find({ _id: session.userId }).lean();

    const user = data[0]

    return user
  } catch (error: unknown) {
    const message =
      typeof error === 'object' &&
        error !== null &&
        'message' in error
        ? String((error as { message: unknown }).message)
        : 'unknown error';

    console.log('Failed to fetch user: %s', message || 'unknown error')
    return null
  }
})

