import TelegramBot from 'node-telegram-bot-api';
import { Button } from './Button';

export interface CallbackAction {
  button: Button;
  nextScreenFunction: (bot: TelegramBot, chatId: number, messageId: number) => Promise<void>;
}

/**
 * Общий обработчик нажатий кнопок.
 * @param bot - Экземпляр бота.
 * @param chatId - Идентификатор чата.
 * @param actions - Массив кнопок и соответствующих функций перехода.
 * @param nextScreenFunction - Функция, которая должна выполняться при совпадении.
 * @param removeHandler - Обработчик для удаления события.
 */
export function handleCallback(
  bot: TelegramBot,
  chatId: number,
  callbackQuery: TelegramBot.CallbackQuery,
  actions: CallbackAction[],
  removeHandler: (callbackQuery: TelegramBot.CallbackQuery) => void
) 
{
  if (!callbackQuery.message || callbackQuery.message.chat.id !== chatId) return;
  
  for (const action of actions) {
    if (callbackQuery.data === action.button.data) {
      const chat_id = callbackQuery.message.chat.id;
      const message_id = callbackQuery.message.message_id;
      
      bot.removeListener('callback_query', removeHandler);
      action.nextScreenFunction(bot, chat_id, message_id);
      break;
    }
  }
}