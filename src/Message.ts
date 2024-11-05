import TelegramBot from "node-telegram-bot-api";
import { InlineKeyboard } from "./InlineKeyboard";

export async function editMessage(bot: TelegramBot, chatId: number, messageId: number, message: string, inlineKeyboard: InlineKeyboard): Promise<number> {
    let message_id = 0;

    await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: inlineKeyboard.layout.reply_markup
    })
    .then(() => {
        message_id = messageId;
    })
    .catch(async () => {
        await bot.sendMessage(chatId, message, inlineKeyboard?.layout)
        .then((message) => {
            message_id = message.message_id;
        });
    });
    
    return message_id;
}