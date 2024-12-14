import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, isCallbackValid, MessageScreen } from '../CallbackHandler';
import { settingsScreen } from './settings';
import User from '../models/User';

const screen = messages.screens.changeName;
const keyboard = screen.inlineKeyboard;

export async function changeNameScreen(messageScreen: MessageScreen) {
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
      const newName = msg.text;

      // Сохранение нового имени в MongoDB
      try {
        await User.findOneAndUpdate(
          { chatId: msg.chat.id },
          { name: newName },
          { upsert: true } // Создаст новую запись, если не найдена
        );
        await bot.sendMessage(chatId, `Ваше новое имя сохранено как: ${newName}`);
      } catch (error) {
        bot.sendMessage(chatId, 'Произошла ошибка при сохранении имени.');
        console.error('Error saving name:', error);
      }

      // Переход назад в меню настроек
      messageScreen.fromScreen.pop()
      await settingsScreen({bot, chatId, messageId: 0, fromScreen: messageScreen.fromScreen});

      // Удаляем обработчик после использования
      bot.removeListener('message', textHandler);
      bot.removeListener('callback_query', callbackHandler);
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