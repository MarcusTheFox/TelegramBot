import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User'; // Модель пользователей

export async function getPlayer(chatId: number) {
  return await User.findOne({ chatId });
}

export async function getPlayerName(bot: TelegramBot, chatId: number) {
  const user = await getPlayer(chatId);
  if (user) return user.name;

  try {
    const userProfile = await bot.getChat(chatId);
    return userProfile.first_name || userProfile.username || `Player ${chatId}`;
  } catch {
    return `Player ${chatId}`;
  }
}