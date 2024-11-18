import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { startScreen } from './screens/start';
import { MessageScreen } from './CallbackHandler';
// Импортируйте другие экраны по мере необходимости

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('Необходимо указать TELEGRAM_BOT_TOKEN в файле .env');
}

mongoose.connect(process.env.MONGO_URI as string)
.then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

const bot = new TelegramBot(token, { polling: true });

// Установите обработчик для команды /start
bot.onText(/\/start/, (msg) => {
  const messageScreen: MessageScreen = {
    bot: bot,
    chatId: msg.chat.id,
    messageId: 0,
    fromScreen: []
  }
  startScreen(messageScreen)
});

// Добавьте другие обработчики сообщений по мере необходимости

