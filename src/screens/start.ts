import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { joinScreen } from './join';
import { gameSelectScreen } from './gameSelect';
import { settingsScreen } from './settings';

const screen = messages.screens.start;
const keyboard = screen.inlineKeyboard;

export async function startScreen(messageScreen: MessageScreen) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenFunction: joinScreen},
    {button: keyboard[1][0], nextScreenFunction: gameSelectScreen},
    {button: screen.inlineKeyboard[2][0], nextScreenFunction: settingsScreen}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler, startScreen);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}