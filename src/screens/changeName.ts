import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
import { settingsScreen } from './settings';
import User from '../models/User';

const screen = messages.screens.changeName;
const keyboard = screen.inlineKeyboard;

export async function changeNameScreen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);

  messageId = await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    {button: keyboard[0][0], nextScreenFunction: settingsScreen}
  ];

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
        bot.sendMessage(chatId, `Ваше новое имя сохранено как: ${newName}`);
      } catch (error) {
        bot.sendMessage(chatId, 'Произошла ошибка при сохранении имени.');
        console.error('Error saving name:', error);
      }

      // Переход назад в меню настроек
      await settingsScreen(bot, chatId, 0);

      // Удаляем обработчик после использования
      bot.removeListener('message', textHandler);
      bot.removeListener('callback_query', callbackHandler);
    }
  };

  bot.on('message', textHandler);

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    bot.removeListener('message', textHandler);
    handleCallback(bot, chatId, messageId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}