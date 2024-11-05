import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { startScreen } from './startScreen';

const screen = messages.screens.game_select;
const buttons = screen.buttons;

export async function selectGamesScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard()
    .addRow([buttons.liars_bar, buttons.cats])
    .addRow([buttons.back]);

  await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: buttons.back, nextScreenFunction: startScreen},
  ]

  function backHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, callbackQuery, actions, backHandler);
  }

  bot.on('callback_query', backHandler);
}
