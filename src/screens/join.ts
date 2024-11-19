import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { startScreen } from './start';

const screen = messages.screens.join;
const keyboard = screen.inlineKeyboard;

export async function joinScreen(messageScreen: MessageScreen) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenCallback: 'backScreen'}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}