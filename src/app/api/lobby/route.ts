import connectDB from '@/lib/mongo';
import Lobby from '@/models/Lobby';
import { NextRequest, NextResponse } from 'next/server';

// List all lobbies
/**
 * List all lobbies
 * @returns List of all lobbies
 */
export async function GET() {
  await connectDB();
  const lobbies = await Lobby.find();
  return NextResponse.json(lobbies);
}

// Create new lobby
/**
 * Create a new lobby
 * @param req Generic HTTP Request
 * @returns Result message
 */
export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const data = await req.json();
    const { name, createdAt = new Date(), gameStarted = false, hostId } = data;

    const newLobby = await Lobby.create({
      name,
      createdAt,
      gameStarted,
      hostId,
    });

    return NextResponse.json(newLobby, { status: 201 });
  } catch (error) {
    console.error('Failed to create lobby:', error);
    return NextResponse.json({ error: 'Failed to create lobby' }, { status: 500 });
  }
}
