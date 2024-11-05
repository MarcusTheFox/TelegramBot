import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { liarsBarScreen } from './liarsBar';
import { catsScreen } from './cats';
import { startScreen } from './start';

const screen = messages.screens.gameSelect;
const keyboard = screen.inlineKeyboard;

export async function gameSelectScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);

  messageId = await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenFunction: liarsBarScreen},
    {button: keyboard[0][1], nextScreenFunction: catsScreen},
    {button: keyboard[1][0], nextScreenFunction: startScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, messageId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}