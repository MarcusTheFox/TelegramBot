import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { createRoomScreen } from './createRoom';

const screen = messages.screens.liarsBar;
const keyboard = screen.inlineKeyboard;

export async function liarsBarScreen(messageScreen: MessageScreen) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenCallback: createRoomScreen},
    // {button: keyboard[0][1], nextScreenCallback: createRoomScreen},
    {button: keyboard[1][0], isBackScreen: true},
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler, liarsBarScreen);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}