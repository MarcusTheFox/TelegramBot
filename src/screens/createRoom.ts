import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { roomScreen } from './room';
import { rulesScreen } from './rules';

const screen = messages.screens.createRoom;
const keyboard = screen.inlineKeyboard;

export async function createRoomScreen(messageScreen: MessageScreen) {
  let text = `Создание комнаты\nИгра: ${messageScreen.data?.game}`
  if (messageScreen.data?.mode)
    text = text.concat(`\nРежим: ${messageScreen.data?.mode}`)
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, text, inlineKeyboard);

  const actions: CallbackAction[] = [
    { button: 
      {
        ...keyboard[0][0], 
        data: 
        {
          game: messageScreen.data?.game,
          mode: messageScreen.data?.mode,
          creator: messageScreen.chatId
        }, 
      },
      nextScreenCallback: roomScreen 
    },
    { button: keyboard[1][0], nextScreenCallback: rulesScreen },
    { button: keyboard[2][0], isBackScreen: true },
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}
