import mongoose, { Schema, model, models } from 'mongoose';

// Define the schema for a game lobby
const LobbySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  players: {
    type: [String], // Array of usernames or player IDs
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Reuse existing model if it exists 
const Lobby = models.Lobby || model('Lobby', LobbySchema);

export default Lobby;
