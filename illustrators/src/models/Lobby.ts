import mongoose, { Schema, model, models } from 'mongoose';

const LobbySchema = new Schema({
  name: {
    type: String,
    required: true,
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

  // new v
  // For host to configure settings BEFORE game
  settings: {
    drawingTime: { type: Number, default: 90 },
    totalRounds: { type: Number, default: 3 },
    difficulty: { type: String, default: 'medium' },
    wordCount: { type: Number, default: 3 },
    wordSelectionTime: { type: Number, default: 15 },
  },
  // new ^
});

const Lobby = models.Lobby || model('Lobby', LobbySchema);

export default Lobby;
