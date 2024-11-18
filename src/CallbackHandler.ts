import TelegramBot from 'node-telegram-bot-api';
import { Button } from './Button';

export interface MessageScreen {
  bot: TelegramBot;
  chatId: number;
  messageId: number;
  fromScreen: Array<(screen: MessageScreen) => Promise<void>>;
}

export interface CallbackAction {
  button: Button;
  nextScreenFunction: ((screen: MessageScreen) => Promise<void>) | "backScreen";
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
  messageScreen: MessageScreen,
  callbackQuery: TelegramBot.CallbackQuery,
  actions: CallbackAction[],
  removeHandler: (callbackQuery: TelegramBot.CallbackQuery) => void,
  fromScreen?: (screen: MessageScreen) => Promise<void>,
) 
{
  if (!callbackQuery.message || callbackQuery.message.chat.id !== messageScreen.chatId || callbackQuery.message.message_id !== messageScreen.messageId) return;
  
  for (const action of actions) {
    if (callbackQuery.data === action.button.data) {
      const chat_id = callbackQuery.message.chat.id;
      const message_id = callbackQuery.message.message_id;
      
      messageScreen.bot.removeListener('callback_query', removeHandler);

      if (action.nextScreenFunction != "backScreen" && fromScreen) {
        messageScreen.fromScreen.push(fromScreen);
      }

      if (action.nextScreenFunction == 'backScreen') {
        const backScreen = messageScreen.fromScreen.pop();
        if (backScreen)
          action.nextScreenFunction = backScreen;
      }

      const nextScreen: MessageScreen = {
        bot: messageScreen.bot, 
        chatId: chat_id, 
        messageId: message_id,
        fromScreen: messageScreen.fromScreen
      };
      
      if (action.nextScreenFunction == 'backScreen') {
        throw new Error("No function for next screen...");
      }

      action.nextScreenFunction(nextScreen);
      break;
    }
  }
}