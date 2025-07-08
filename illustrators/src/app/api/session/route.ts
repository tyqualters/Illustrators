import { NextResponse } from 'next/server'; // imports the Next.js helper for returning responses in API routes
import { decrypt } from '@/lib/session'; // imports a custom decrypt function used to decode the session token
import type { NextRequest } from 'next/server'; // type import for typed request objects

// handles GET requests to check for valid use
export async function GET(req: NextRequest) {
  // attempt to retrieve the session token from cookies
  const sessionToken = req.cookies.get('session')?.value;

  // If no session token exists, respond with 404 error
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session found' }, { status: 404 });
  }

  // attempt to decrypt the session token to retrieve user data
  const payload = await decrypt(sessionToken);

  // if the session payload is missing, invalid, or incomplete, return 401 for unauthorized
  if (!payload || typeof payload !== 'object' || !payload.userId || !payload.name) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // if session is valid, return the user's id and name in the response
  return NextResponse.json({
    id: payload.userId,
    name: payload.name,
  });
}
