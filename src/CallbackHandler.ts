import TelegramBot from 'node-telegram-bot-api';
import { Button, ButtonData } from './Button';

export interface MessageScreen {
  bot: TelegramBot;
  chatId: number;
  messageId: number;
  fromScreen: Array<(screen: MessageScreen) => Promise<void>>;
  data?: ButtonData;
}

export interface CallbackAction {
  button: Button;
  isBackScreen?: true;
  nextScreenCallback?: ((screen: MessageScreen) => Promise<void>);
}

export function handleCallback(
  messageScreen: MessageScreen,
  callbackQuery: TelegramBot.CallbackQuery,
  actions: CallbackAction[],
  callbackHandler: (callbackQuery: TelegramBot.CallbackQuery) => void,
  currentScreenFunction?: (screen: MessageScreen) => Promise<void>,
) {
  if (!isCallbackValid(callbackQuery, messageScreen)) return;
  
  const action = actions.find(a => a.button.callback_data === callbackQuery.data);
  if (!action) {
    console.warn(`Неизвестный callback_data: ${callbackQuery.data}`);
    return;
  }
  
  if (!action.isBackScreen && !action.nextScreenCallback) return;

  messageScreen.bot.removeListener('callback_query', callbackHandler);

  if (action.isBackScreen) {
    handleBackScreen(messageScreen, action.button.data);
    return;
  }

  if (currentScreenFunction) {
    messageScreen.fromScreen.push(currentScreenFunction);
  }

  const nextScreen = createNextMessageScreen(messageScreen, action.button.data); 
  if (action.nextScreenCallback)
    action.nextScreenCallback(nextScreen);
}

function isCallbackValid(callbackQuery: TelegramBot.CallbackQuery, messageScreen: MessageScreen): boolean {
  return (
    !!callbackQuery.message &&
    callbackQuery.message.chat.id === messageScreen.chatId &&
    callbackQuery.message.message_id === messageScreen.messageId
  )
}

function handleBackScreen(messageScreen: MessageScreen, buttonData?: ButtonData) {
  const previousScreen = messageScreen.fromScreen.pop();
  if (!previousScreen) {
    console.error("Ошибка: попытка вернуться назад, но стек экранов пуст.");
    return;
  }
  const screen = createNextMessageScreen(messageScreen, buttonData);
  previousScreen(screen);
}

function createNextMessageScreen(
  messageScreen: MessageScreen,
  buttonData?: ButtonData
): MessageScreen {

  return {
    ...messageScreen,
    data: buttonData,
  };
}
