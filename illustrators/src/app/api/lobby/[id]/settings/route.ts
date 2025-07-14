import { NextRequest, NextResponse } from 'next/server';
import Lobby from '@/models/Lobby';
import connectDB from '@/lib/mongo'; // mongo connection
import { GameSettings } from '@/lib/gameLoop/state/gameState';

/**
 * PUT /api/lobby/[id]/settings
 * 
 * This route allows the host to update the game settings (drawing time/difficulty/rounds/etc)
 * for a specific lobby before the game starts
 * 
 * The client sends a JSON body with a GameSettings object
 * 
 * @param req - Next.js request object, containing the settings in JSON format in the body
 * @param param1 - an object with a 'params' property that contains the ID of the lobby to update
 * @returns - a JSON response containing either the updated lobby doc or an error msg
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    //const lobbyId = params.id;
    const { id: lobbyId } = await params; // params fix?
    const body = await req.json(); // expecting settings obj from host

    try {
        // make sure that mongo connection is active
        await connectDB();

        // update settings in specified lobby
        const updatedLobby = await Lobby.findByIdAndUpdate(
            lobbyId,
            { settings: body as GameSettings },
            { new: true } // return updated lobby document
        );

        // handle case where lobby doesnt exist
        if (!updatedLobby) {
            return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        // return updated lobby with new settings
        return NextResponse.json(updatedLobby);
    } catch (err) {
        console.error('[PUT /lobby/:id/settings]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
