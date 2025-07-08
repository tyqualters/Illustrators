// File: src/app/api/lobby/[id]/route.ts

import connectDB from '@/lib/mongo';
import Lobby from '@/models/Lobby';
import { NextRequest, NextResponse } from 'next/server';

// Get lobby by ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { params } = await context;  // Await context to get params
  const { id } = await params;

  const lobby = await Lobby.findById(id);
  if (!lobby) {
    return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
  }

  return NextResponse.json(lobby);
}

// Update lobby settings (e.g. name, gameStarted, hostId)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { params } = await context;  // Await context to get params
  const { id } = await params;

  try {
    const data = await req.json();

    // Only allow updating these fields
    const updateFields = {
      ...(data.name && { name: data.name }),
      ...(typeof data.gameStarted === 'boolean' && { gameStarted: data.gameStarted }),
      ...(data.hostId && { hostId: data.hostId }),
    };

    const updated = await Lobby.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update lobby:', error);
    return NextResponse.json({ error: 'Failed to update lobby' }, { status: 400 });
  }
}

// Delete lobby by ID
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { params } = await context;  // Await context to get params
  const { id } = await params;

  const deleted = await Lobby.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
