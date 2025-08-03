// warning: legendary vibe coding present
// userId = session token field (represents authenticated user's ID)


import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { SessionPayload } from '@/lib/definitions';
import { cookies } from 'next/headers'


const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

/**
 * Create the JWT
 * @param payload 
 * @returns 
 */
export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

/**
 * Read the JWT
 * @param session 
 * @returns 
 */
export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error: unknown) {
    const message =
      typeof error === 'object' &&
        error !== null &&
        'message' in error
        ? String((error as { message: unknown }).message)
        : 'unknown error';

    console.log('Failed to verify session: %s', message || 'unknown error')
  }
}

/**
 * Create the JWT
 * @param userId 
 * @param name 
 */
export async function createSession(userId: string, name: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, name, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

/**
 * Update JWT to avoid reverifying
 * @returns 
 */
export async function updateSession() {
  const session = (await cookies()).get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) {
    return null
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
}

/**
 * Delete session (logout backend)
 */
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
