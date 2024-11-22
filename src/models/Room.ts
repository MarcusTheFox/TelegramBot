import mongoose, { Schema, Document } from 'mongoose';

interface Room extends Document {
  code: string; // Уникальный код комнаты
  game: string;
  mode?: string;
  creator: number; // Telegram ID создателя
  players: number[]; // Telegram ID подключенных игроков
  messageIds: { [key: number]: number }; // Сопоставление Telegram ID игрока и его messageId
}

const RoomSchema = new Schema<Room>({
  code: { type: String, required: true, unique: true },
  game: { type: String, required: true },
  mode: { type: String },
  creator: { type: Number, required: true },
  players: { type: [Number], required: true, default: [] },
  messageIds: { type: Map, of: Number, default: {} }, // Для хранения messageId каждого игрока
});

const RoomModel = mongoose.model<Room>('Room', RoomSchema);

export default RoomModel;
