import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { changeNameScreen } from './changeName';
import { resetNameScreen } from './resetName';
import { startScreen } from './start';

const screen = messages.screens.settings;
const keyboard = screen.inlineKeyboard;

export async function settingsScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);

  messageId = await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenFunction: changeNameScreen},
    {button: keyboard[0][1], nextScreenFunction: resetNameScreen},
    {button: keyboard[1][0], nextScreenFunction: startScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, messageId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}