import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { settingsScreen } from './settings';
import User from '../models/User';

const screen = messages.screens.resetName;
const keyboard = screen.inlineKeyboard;

export async function resetNameScreen(messageScreen: MessageScreen) {
  try {
    await User.findOneAndDelete({ chatId: messageScreen.chatId });
  } catch(err) {}

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