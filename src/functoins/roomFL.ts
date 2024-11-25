import { MessageScreen } from '../CallbackHandler';
import RoomModel from '../models/Room';

export const player_update_event_string = "players_update";
export const game_start_event_string = "game_start";

export async function createRoom(messageScreen: MessageScreen) {
  let room = new RoomModel({
      code: Math.random().toString(36).substring(2, 8).toUpperCase(), // Генерация случайного кода комнаты
      game: messageScreen.data?.game,
      mode: messageScreen.data?.mode,
      creator: messageScreen.chatId,
      players: [messageScreen.chatId], // Создатель - первый игрок
  });
  await room.save();
  return room;
}

export async function deleteRoom(code: string) {
  await RoomModel.deleteOne({ code });
}

export async function findRoom(messageScreen: MessageScreen) {
  return await RoomModel.findOne({ code: messageScreen.data?.code }) || 
         await RoomModel.findOne({ creator: messageScreen.data?.creator });
}

export async function findRoomByCode(code?: string) {
  return await RoomModel.findOne({ code });
}

export async function removePlayer(messageScreen: MessageScreen) {
  const bot = messageScreen.bot;
  const chatId = messageScreen.chatId;
  const code = messageScreen.data?.code;

  const room = await findRoomByCode(code);
  if (!room) return;

  room.players = room.players.filter((playerId) => playerId !== chatId);
  
  if (room.creator === chatId) {
    if (room.players.length > 0) {
      room.creator = room.players[0];
    } else {
      await deleteRoom(room.code);
      return;
    }
  }

  await room.save();
  
  bot.emit(player_update_event_string);
}