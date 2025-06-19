import mongoose, { Schema, model, models } from 'mongoose';

// Define a subdocument schema for a player
const PlayerSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Define the schema for a game lobby
const LobbySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  players: {
    type: [PlayerSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  gameStarted: {
    type: Boolean,
    default: false,
  },
  hostId: {
    type: String,
  },
});

const Lobby = models.Lobby || model('Lobby', LobbySchema);

export default Lobby;
