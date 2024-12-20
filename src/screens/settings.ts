import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
import { changeNameScreen } from './changeName';
import { resetNameScreen } from './resetName';

const screen = messages.screens.settings;
const keyboard = screen.inlineKeyboard;

export async function settingsScreen(messageScreen: MessageScreen) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenCallback: changeNameScreen},
    {button: keyboard[0][1], nextScreenCallback: resetNameScreen},
    {button: keyboard[1][0], isBackScreen: true}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler, settingsScreen);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}