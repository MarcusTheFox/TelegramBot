import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { liarsBarScreen } from './liarsBar';
import { catsScreen } from './cats';
import { startScreen } from './start';

const screen = messages.screens.gameSelect;
const keyboard = screen.inlineKeyboard;

export async function gameSelectScreen(messageScreen: MessageScreen) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenFunction: liarsBarScreen},
    // {button: keyboard[0][1], nextScreenFunction: catsScreen},
    {button: keyboard[1][0], nextScreenFunction: 'backScreen'}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler, gameSelectScreen);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}