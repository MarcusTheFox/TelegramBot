import mongoose, { Schema, Document } from 'mongoose';

interface Game extends Document {
  roomCode: string; // Код комнаты
  table: "A" | "K" | "Q"; // Стол для карт (Например, стол дам)
  deck: string[]; // Остаток колоды
  players: { 
    chatId: number; 
    hand: string[]; 
    loseCount: number; 
    spectator: boolean; 
    order: number }[]; // Игроки с их картами
  currentPlayerIndex: number; // Индекс текущего игрока
  turnHistory: { playerId: number; playedCards: string[] }[]; // История ходов
  liarCall?: { accuserId: number; accusedId: number }; // Текущее обвинение в обмане
}

const GameSchema = new Schema<Game>({
  roomCode: { type: String, required: true, unique: true },
  table: { type: String, required: true },
  deck: { type: [String], required: true }, // Например: ["A", "2", "K", "Q", "10", ...]
  players: [
    {
      chatId: { type: Number, required: true },
      hand: { type: [String], required: true },
      loseCount: { type: Number, required: true },
      spectator: { type: Boolean, required: true },
      order: { type: Number, required: true }, // Порядок хода
    },
  ],
  currentPlayerIndex: { type: Number, required: true, default: 0 },
  turnHistory: [{ playerId: { type: Number }, playedCards: [String] }],
  liarCall: {
    accuserId: { type: Number },
    accusedId: { type: Number },
  },
});

const GameModel = mongoose.model<Game>('Game', GameSchema);
export default GameModel;
