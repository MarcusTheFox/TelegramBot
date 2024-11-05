import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { startScreen } from './startScreen';

const screen = messages.screens.settings
const buttons = screen.buttons;

export async function settingsScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard()
    .addRow([buttons.change_name, buttons.reset_name])
    .addRow([buttons.back]);
  
  await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: buttons.back, nextScreenFunction: startScreen},
  ]

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}
