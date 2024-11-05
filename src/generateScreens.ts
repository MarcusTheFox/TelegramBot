import * as fs from 'fs';
import * as path from 'path';

interface Button {
  text: string;
  data: string;
}

interface Screen {
  text: string;
  inlineKeyboard: Button[][];
}

interface Screens {
  [key: string]: Screen;
}

// Загрузите ваши сообщения из JSON
const messages: { screens: Screens } = JSON.parse(fs.readFileSync(path.join(__dirname, 'messages.json'), 'utf-8'));

// Функция для генерации кода экрана
const generateScreenCode = (screenName: string, screen: Screen): string => {
  const targetScreens: string[] = [];
  screen.inlineKeyboard.map(row => {
    row.map(el => {
      let target = el.data.split("_to_")[1];
      targetScreens.push(
        `import { ${target}Screen } from './${target}';`
      );
    })
  })

  const inlineKeyboard = screen.inlineKeyboard.map((row, rowIndex) => {
    return `.addRow([${row.map((button, buttonIndex) => {
      return `keyboard[${rowIndex}][${buttonIndex}]`;
    }).join(', ')}])`;
  }).join('\n    ');

  const actions = screen.inlineKeyboard.map((row, rowIndex) => {
    return row.map((el, elIndex) => {
      return `{button: keyboard[${rowIndex}][${elIndex}], nextScreenFunction: ${el.data.split("_to_")[1]}Screen}`;
    }).join(',\n    ')
  }).join(",\n    ");

  return `
import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback } from '../CallbackHandler';
${targetScreens.join('\n')}

const screen = messages.screens.${screenName};
const keyboard = screen.inlineKeyboard;

export async function ${screenName}Screen(bot: TelegramBot, chatId: number, messageId: number) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);

  messageId = await editMessage(bot, chatId, messageId, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    ${actions}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(bot, chatId, messageId, callbackQuery, actions, callbackHandler);
  }

  bot.on('callback_query', callbackHandler);
}
`;
};

// Функция для генерации всех экранов
const generateScreens = (overwrite: boolean) => {
  const screensDir = path.join(__dirname, 'screens');

  // Создаём директорию, если она не существует
  if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
  }

  // Если флаг перезаписи, удаляем старые файлы
  if (overwrite) {
    fs.readdirSync(screensDir).forEach(file => {
      fs.unlinkSync(path.join(screensDir, file));
    });
  }

  // Генерация новых экранов
  for (const [screenName, screen] of Object.entries(messages.screens)) {
    const filePath = path.join(screensDir, `${screenName}.ts`);
    const screenCode = generateScreenCode(screenName, screen);
    
    if (!fs.existsSync(filePath) || overwrite) {
      fs.writeFileSync(filePath, screenCode.trim());
      console.log(`Сгенерирован файл: ${filePath}`);
    } else {
      console.log(`Файл уже существует и не будет перезаписан: ${filePath}`);
    }
  }
};

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const overwriteFlag = args.includes('-overwrite');

// Генерация экранов
generateScreens(overwriteFlag);
