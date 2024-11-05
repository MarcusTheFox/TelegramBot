import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { gameSelectScreen } from './gameSelect';

const screen = messages.screens.cats;
const keyboard = screen.inlineKeyboard;

export async function catsScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);

  messageId = await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenFunction: gameSelectScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, messageId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}