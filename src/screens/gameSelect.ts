import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { liarsBarScreen } from './liarsBar';
import { catsScreen } from './cats';
import { startScreen } from './start';

const screen = messages.screens.gameSelect
const buttons = screen.buttonRows;

export async function gameSelectScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard()
    .addRow([{text: "Liar`s Bar", data: "gameSelect_to_liarsBar"}, {text: "Взрывные котята", data: "gameSelect_to_cats"}])
    .addRow([{text: "Назад", data: "gameSelect_to_start"}]);

  await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: buttons[0][0], nextScreenFunction: liarsBarScreen},
    {button: buttons[0][1], nextScreenFunction: catsScreen},
    {button: buttons[1][0], nextScreenFunction: startScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}