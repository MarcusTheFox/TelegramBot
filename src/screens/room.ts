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

export async function roomScreen(messageScreen: MessageScreen) {
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

  const nextScreen = await editMessage(messageScreen, text, inlineKeyboard, 'MarkdownV2');

  const actions: CallbackAction[] = [
    {
      button: keyboard[0][0],
      nextScreenCallback: async () => {
        const players = room.players;
        if (players.length < 2) {
          await editMessage(nextScreen, text+"\n\nДля начала игры требуется хотя бы два игрока\\.", inlineKeyboard, 'MarkdownV2');
          bot.on('callback_query', callbackHandler);
          return;
        }
        if (!messageScreen.data?.code) return;

        const gameScreenModule = await import(`./${messageScreen.data.game}/game${messageScreen.data.mode ? "_" + messageScreen.data.mode : ""}`);
        await gameScreenModule.initializeGame(room, bot);

        bot.emit(game_start_event_string, {roomCode: room.code, gameScreen: gameScreenModule});
      },
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
    bot.removeListener(player_update_event_string, updateRoomPlayers);
    bot.removeListener(game_start_event_string, gameStart);
    bot.removeListener('callback_query', callbackHandler);
    roomScreen(nextScreen);
  }

  const gameStart = async (callback: any) => {
    const { roomCode, gameScreen } = callback;
    if (roomCode !== messageScreen.data?.code) {
      console.log("Room Code Error");
      return;
    }

    bot.removeListener(player_update_event_string, updateRoomPlayers);
    bot.removeListener(game_start_event_string, gameStart);
    bot.removeListener('callback_query', callbackHandler);

    gameScreen.default({ 
      ...nextScreen, 
      fromScreen: [], 
      data: { code: room.code } 
    });
  }

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    // if (!isCallbackValid(callbackQuery, messageScreen)) return;
    // bot.removeListener(player_update_event_string, updateRoomPlayers);
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler);
  }

  bot.on(player_update_event_string, updateRoomPlayers);
  bot.on(game_start_event_string, gameStart);
  bot.on('callback_query', callbackHandler);
}

function getRoomText(players: string[], code: string, game: string, mode?: string) {
  let text = `Комната создана\\!\n\nКод: \`\\\`${code}\\\`\`\nИгра: ${game}`;
  if (mode) text += `\nРежим: ${mode}`;
  text += `\n\nИгроки:\n${players.map((name) => `\\- ${name}`).join('\n')}`;
  return text;
}