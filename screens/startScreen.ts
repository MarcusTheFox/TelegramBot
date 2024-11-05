import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { selectGamesScreen } from './selectGamesScreen';
import { settingsScreen } from './settingsScreen';

const screen = messages.screens.start
const buttons = screen.buttons;

export async function startScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard()
    .addRow([buttons.join])
    .addRow([buttons.create])
    .addRow([buttons.settings]);
  
  await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: buttons.create, nextScreenFunction: selectGamesScreen},
    {button: buttons.settings, nextScreenFunction: settingsScreen}
  ]

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}
