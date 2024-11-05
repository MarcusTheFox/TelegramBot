import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { settingsScreen } from './settings';
import User from '../models/User';

const screen = messages.screens.resetName;
const keyboard = screen.inlineKeyboard;

export async function resetNameScreen(bot: TelegramBot, chatId: number, messageId: number) {
  try {
    await User.findOneAndDelete({ chatId });
  } catch(err) {
    
  }

  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);

  messageId = await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenFunction: settingsScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, messageId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}