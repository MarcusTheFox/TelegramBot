import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, isCallbackValid, MessageScreen } from '../CallbackHandler';
import { roomScreen } from './room';
import User from '../models/User';
import RoomModel from '../models/Room';

const screen = messages.screens.join;
const keyboard = screen.inlineKeyboard;

export async function joinScreen(messageScreen: MessageScreen) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], isBackScreen: true}
  ];

  
  const bot = messageScreen.bot;
  const chatId = messageScreen.chatId;
  // Временный обработчик текстового сообщения
  const textHandler = async (msg: TelegramBot.Message) => {
    if (msg.chat.id === chatId && msg.text) {

      // Удаляем обработчик после использования
      bot.removeListener('message', textHandler);
      bot.removeListener('callback_query', callbackHandler);

      const codeRoom = msg.text;

      // проверка кода комнаты в MongoDB
      const room = await RoomModel.findOne({ code: codeRoom });
      
      if (!room) {
        await bot.sendMessage(chatId, `Комната с кодом ${codeRoom} не найдена. Попробуйте снова.`);
        await joinScreen({...messageScreen, messageId: 0});
      }
      else {
        await roomScreen({bot, chatId, messageId: 0, fromScreen: [], data: {code: codeRoom}});
      }
    }
  };

  bot.on('message', textHandler);

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    if (!isCallbackValid(callbackQuery, messageScreen)) return;
    bot.removeListener('message', textHandler);
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler);
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}