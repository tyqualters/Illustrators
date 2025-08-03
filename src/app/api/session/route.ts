/**
 * This API route handles session validation by reading and decrypting
 * a session token from the user's cookies. If the session is valid, it returns
 * the user's ID and name as JSON. If the session is missing or invalid, it
 * returns an appropriate error response.
 *
 * It is used for authenticating user sessions on the client-side or server-side
 * by confirming identity without re-login.
 */

import { NextResponse } from 'next/server'; // import Next.js response utility
import { decrypt } from '@/lib/session'; // import custom decrypt function used to decode the session payload
import type { NextRequest } from 'next/server'; // import Next.js request type for typed request object


// GET handler is triggered when the client fetches session info from this route
/**
 * Validate session
 * @param req Generic HTTP Request
 * @returns Session valid
 */
export async function GET(req: NextRequest) {
  // get the session token from cookies
  const sessionToken = req.cookies.get('session')?.value;

  // if no session token exists, respond with a 404 error
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session found' }, { status: 404 });
  }

  // decrypt the session token to retrieve the user payload (like userId, name)
  const payload = await decrypt(sessionToken);

  // if the payload is missing or malformed, respond with a 401 (unauthorized)
  if (!payload || typeof payload !== 'object' || !payload.userId || !payload.name) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // if session is valid, return the user ID and name as JSON
  return NextResponse.json({
    id: payload.userId,
    name: payload.name,
  });
}
