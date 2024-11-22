import RoomModel from '../models/Room';
import User from '../models/User'; // Модель пользователей
import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { startScreen } from './start';

const screen = messages.screens.room;
const keyboard = screen.inlineKeyboard;

export async function roomScreen(messageScreen: MessageScreen) {
  // Проверяем, существует ли комната
  let room = await RoomModel.findOne({ code: messageScreen.data?.code }) || 
             await RoomModel.findOne({ creator: messageScreen.data?.creator });

  // Создаем комнату, если она не существует
  if (!room) {
    room = new RoomModel({
      code: Math.random().toString(36).substring(2, 8).toUpperCase(), // Генерация случайного кода комнаты
      game: messageScreen.data?.game,
      mode: messageScreen.data?.mode,
      creator: messageScreen.chatId,
      players: [messageScreen.chatId], // Создатель - первый игрок
    });
    await room.save();
    messageScreen.data = { ...messageScreen.data, code: room.code };
  }
  else {
    if (messageScreen.data?.code) {
      if (!room.players.includes(messageScreen.chatId)) {
        room.players.push(messageScreen.chatId);
        await room.save();
      }

      await updateRoomScreens(messageScreen.bot, room.code);
    }
  }

  const playerNames = await Promise.all(
    room.players.map(async (playerId) => {
      const user = await User.findOne({ chatId: playerId });
      if (user) return user.name;
      try {
        const userProfile = await messageScreen.bot.getChat(playerId);
        return userProfile.first_name || userProfile.username || `Player ${playerId}`;
      } catch {
        return `Player ${playerId}`;
      }
    })
  );

  let text = `Комната создана!\nКод: ${room.code}\nИгра: ${room.game}`;
  if (room.mode) text += `\nРежим: ${room.mode}`;
  text += `\n\nИгроки:\n${playerNames.map((name) => `- ${name}`).join('\n')}`;

  const isCreator = room.creator === messageScreen.chatId;

  const inlineKeyboard = new InlineKeyboard();
  if (isCreator) {
    inlineKeyboard.addRow([keyboard[0][0]]); // Кнопка "Начать игру"
  }
  inlineKeyboard.addRow([keyboard[1][0]]); // Кнопка "Правила"
  inlineKeyboard.addRow([keyboard[2][0]]); // Кнопка "Выйти из комнаты"

  const nextScreen = await editMessage(messageScreen, text, inlineKeyboard);
  // Обновляем messageId каждого игрока в комнате
  room.players.forEach(playerId => {
    room.messageIds[playerId] = nextScreen.messageId; // Устанавливаем messageId для каждого игрока
  });

  await room.save(); // Сохраняем обновления комнаты

  const actions: CallbackAction[] = [
    // {
    //   button: keyboard[0][0],
    //   nextScreenCallback: isCreator ? gameScreen : undefined,
    // },
    // { button: keyboard[1][0], nextScreenCallback: ruleScreen },
    {
      button: keyboard[2][0], // Выход из комнаты
      nextScreenCallback: async () => {
        console.log(messageScreen)
        await leaveRoom(messageScreen);
        await updateRoomScreens(messageScreen.bot, room.code); // Обновляем экран для всех игроков
        await startScreen({...nextScreen, fromScreen: []}) // Возвращаем игрока на стартовый экран.
        return;
      },
    },
  ]//.filter((a) => a.nextScreenCallback);

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}

async function leaveRoom(messageScreen: MessageScreen) {
  const room = await RoomModel.findOne({ code: messageScreen.data?.code });
  console.log(`${room} ${messageScreen.data}`)
  if (!room) {
    console.error('Ошибка: комната не найдена.');
    return;
  }

  // Удаляем игрока из комнаты
  room.players = room.players.filter((playerId) => playerId !== messageScreen.chatId);

  if (room.creator === messageScreen.chatId) {
    // Если создатель покинул комнату
    if (room.players.length > 0) {
      room.creator = room.players[0];
    } else {
      // Если игроков не осталось, удаляем комнату
      await RoomModel.deleteOne({ code: room.code });
      return;
    }
  }

  await room.save();
}

async function updateRoomScreens(bot: TelegramBot, roomCode: string) {
  const room = await RoomModel.findOne({ code: roomCode });

  if (!room) {
    console.error('Ошибка: комната не найдена для обновления.');
    return;
  }

  for (const playerId of room.players) {
    try {
      const messageId = room.messageIds[playerId]; // ID сообщения экрана для каждого игрока
      if (!messageId) continue;

      const screen: MessageScreen = {
        bot,
        chatId: playerId,
        messageId,
        fromScreen: [], // Стек не нужен для обновления
        data: { code: room.code },
      };

      await roomScreen(screen); // Перегенерируем экран
    } catch (err) {
      console.error(`Ошибка обновления экрана для игрока ${playerId}:`, err);
    }
  }
}
