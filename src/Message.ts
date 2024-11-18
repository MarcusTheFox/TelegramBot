import TelegramBot from "node-telegram-bot-api";
import { InlineKeyboard } from "./InlineKeyboard";
import { MessageScreen } from "./CallbackHandler";

export async function editMessage(screen: MessageScreen, message: string, inlineKeyboard: InlineKeyboard): Promise<MessageScreen> {
  let message_id = 0;

  await screen.bot.editMessageText(message, {
    chat_id: screen.chatId,
    message_id: screen.messageId,
    reply_markup: inlineKeyboard.layout.reply_markup
  })
  .then(() => {
    message_id = screen.messageId;
  })
  .catch(async () => {
    await screen.bot.sendMessage(screen.chatId, message, inlineKeyboard?.layout)
    .then((message) => {
      message_id = message.message_id;
    });
  });
  
  const nextScreen: MessageScreen = {
    bot: screen.bot,
    chatId: screen.chatId,
    messageId: message_id,
    fromScreen: screen.fromScreen
  }

  return nextScreen;
}