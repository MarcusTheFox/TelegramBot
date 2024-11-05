import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { changeNameScreen } from './changeName';
import { resetNameScreen } from './resetName';
import { startScreen } from './start';

const screen = messages.screens.settings
const buttons = screen.buttonRows;

export async function settingsScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard()
    .addRow([{text: "Изменить имя", data: "settings_to_changeName"}, {text: "Сбросить имя", data: "settings_to_resetName"}])
    .addRow([{text: "Назад", data: "settings_to_start"}]);

  await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: buttons[0][0], nextScreenFunction: changeNameScreen},
    {button: buttons[0][1], nextScreenFunction: resetNameScreen},
    {button: buttons[1][0], nextScreenFunction: startScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}