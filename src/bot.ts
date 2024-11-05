import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { startScreen } from './screens/start';
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
  startScreen(bot, msg.chat.id, 0); // Переход к экрану "start"
});

// Добавьте другие обработчики сообщений по мере необходимости

