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
});

const Lobby = models.Lobby || model('Lobby', LobbySchema);

export default Lobby;
