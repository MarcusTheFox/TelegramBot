import RoomModel from '../models/Room';
import User from '../models/User'; // Модель пользователей
import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, isCallbackValid, MessageScreen } from '../CallbackHandler';
// import { gameScreen } from './game';
// import { rulesScreen } from './rules';
import { startScreen } from './start';
import { createRoom, findRoom, game_start_event_string, player_update_event_string, removePlayer } from '../functoins/roomFL';
import { getPlayerName } from '../functoins/userFL';

const screen = messages.screens.room;
const keyboard = screen.inlineKeyboard;

export async function roomScreen(messageScreen: MessageScreen, isAlreadyConnected: boolean = false) {
  const bot = messageScreen.bot;

  let room = await findRoom(messageScreen);

  if (!room) {
    room = await createRoom(messageScreen);
  }
  else {
    if (!room.players.includes(messageScreen.chatId)) {
      room.players.push(messageScreen.chatId);
      await room.save();
      bot.emit(player_update_event_string);
    }
  }
  messageScreen.data = { ...messageScreen.data, code: room.code };

  const isCreator = room.creator === messageScreen.chatId;

  const playerNames = await Promise.all(
    room.players.map(async chatId => await getPlayerName(bot, chatId)));

  const text = getRoomText(playerNames, room.code, room.game, room.mode);
  await room.save();


  const inlineKeyboard = new InlineKeyboard();
  if (isCreator) {
    inlineKeyboard.addRow([keyboard[0][0]]); // Кнопка "Начать игру"
  }
  // inlineKeyboard.addRow([keyboard[1][0]]); // Кнопка "Правила"
  inlineKeyboard.addRow([keyboard[2][0]]); // Кнопка "Выйти из комнаты"

  const nextScreen = await editMessage(messageScreen, text, inlineKeyboard);

  // room.players.forEach(playerId => room.messageIds[playerId] = nextScreen.messageId);
  
  const actions: CallbackAction[] = [
    {
      button: keyboard[0][0],
      nextScreenCallback: async () => {bot.emit(game_start_event_string)},
    },
    {
      button: keyboard[2][0], // Выход из комнаты
      nextScreenCallback: async () => {
        bot.removeListener(player_update_event_string, updateRoomPlayers);
        await removePlayer(messageScreen);
        await startScreen({...nextScreen, fromScreen: []}) // Возвращаем игрока на стартовый экран.
        return;
      },
    },
  ]

  const updateRoomPlayers = () => {
    roomScreen(nextScreen, true);
  }

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    // if (!isCallbackValid(callbackQuery, messageScreen)) return;
    // bot.removeListener(player_update_event_string, updateRoomPlayers);
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler);
  }

  if (!isAlreadyConnected) {
    bot.on(player_update_event_string, updateRoomPlayers);
    bot.on(game_start_event_string, updateRoomPlayers);
    bot.on('callback_query', callbackHandler);
  }
}

function getRoomText(players: string[], code: string, game: string, mode?: string) {
  let text = `Комната создана!\n\nКод: ${code}\nИгра: ${game}`;
  if (mode) text += `\nРежим: ${mode}`;
  text += `\n\nИгроки:\n${players.map((name) => `- ${name}`).join('\n')}`;
  return text;
}