import { NextResponse } from 'next/server'; // imports the Next.js helper for returning responses in API routes
import connectDB from '@/lib/mongo';
import User from '@/models/User';
import type { NextRequest } from 'next/server'; // type import for typed request objects
import crypto from 'crypto';

/**
 * Convert string to SHA-256
 * @param input string
 * @returns SHA-256
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get user info
 * @param req Generic HTTP Request
 * @param context User ID
 * @returns User info
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { params } = await context;  // Await context to get params
  const { id } = await params;

    // Check for valid Mongo ObjectId format
  if (!id || id.length !== 24) {
    return NextResponse.json({ error: 'User ID is malformed.' }, { status: 400 });
  }

  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: 'User does not exist' }, { status: 404 });
  }
 
  return NextResponse.json({
    id: id,
    name: user?.name,
    gravatar: `https://gravatar.com/avatar/${ await sha256(user?.email.trim().toLowerCase()) }`
  });
}
