// HOW TO FIX PARAMS ERROR: 
// https://stackoverflow.com/questions/79143162/route-locale-used-params-locale-params-should-be-awaited-before-using
// https://nextjs.org/docs/messages/sync-dynamic-apis#possible-ways-to-fix-it

import connectDB from '@/lib/mongo';
import Lobby from '@/models/Lobby';
import { NextRequest, NextResponse } from 'next/server';
import PrintError from '@/lib/printErr';

// Get lobby by ID
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  //const lobby = await Lobby.findById(params.id);  (this causes a params error)

  // fixes params error:
  const { id: lobbyId } = await params;
  const lobby = await Lobby.findById(lobbyId);

  if (!lobby) return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });

  return NextResponse.json(lobby);
}

// Update lobby (e.g. join a lobby)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  // fixes params error:
  const { id: lobbyId } = await params;


  try {
    const data = await req.json();
    const updated = await Lobby.findByIdAndUpdate(lobbyId, data, { new: true }); // params error fix

    if (!updated) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    PrintError(error);
    
    return NextResponse.json({ error: 'Failed to update lobby' }, { status: 400 });
  }
}

// Delete lobby by ID
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  //const deleted = await Lobby.findByIdAndDelete(params.id);  (this causes params error)

  // params error fix:
  const { id: lobbyId } = await params;
  const deleted = await Lobby.findByIdAndDelete(lobbyId);

  if (!deleted) {
    return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
