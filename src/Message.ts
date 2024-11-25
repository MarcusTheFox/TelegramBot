import TelegramBot from "node-telegram-bot-api";
import { InlineKeyboard } from "./InlineKeyboard";
import { MessageScreen } from "./CallbackHandler";

export async function editMessage(
  screen: MessageScreen, 
  message: string, 
  inlineKeyboard: InlineKeyboard
): Promise<MessageScreen> {
  let message_id = 0;

  if (!screen.content) {
    await screen.bot.sendMessage(screen.chatId, message, inlineKeyboard?.layout)
      .then((message) => {
        message_id = message.message_id;
      });
  }
  else {
    await screen.bot.editMessageText(message, {
      chat_id: screen.chatId,
      message_id: screen.messageId,
      reply_markup: inlineKeyboard.layout.reply_markup
    })
    .then(() => {
      message_id = screen.messageId;
    })
    .catch(async (e) => {
      console.log(e.response?.body?.description);
      const description = e.response?.body?.description;
      if (!description.includes('message is not modified')) {
        await screen.bot.sendMessage(screen.chatId, message, inlineKeyboard?.layout)
        .then((message) => {
          message_id = message.message_id;
        });
      }
      else {
        message_id = screen.messageId;
      }
    });
  }
  
  const nextScreen: MessageScreen = {
    bot: screen.bot,
    chatId: screen.chatId,
    messageId: message_id,
    fromScreen: screen.fromScreen,
    data: screen.data,
    content: {
      text: message,
      inlineKeyboard: inlineKeyboard
    }
  }

  return nextScreen;
}