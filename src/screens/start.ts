import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { gameSelectScreen } from './gameSelect';
import { joinScreen } from './join';
import { settingsScreen } from './settings';

const screen = messages.screens.start
const buttons = screen.buttonRows;

export async function startScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard()
    .addRow([{text: "Создать комнату", data: "start_to_gameSelect"}])
    .addRow([{text: "Присоединиться", data: "start_to_join"}])
    .addRow([{text: "Настройки", data: "start_to_settings"}]);

  await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: buttons[0][0], nextScreenFunction: gameSelectScreen},
    {button: buttons[1][0], nextScreenFunction: joinScreen},
    {button: buttons[2][0], nextScreenFunction: settingsScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}