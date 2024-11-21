import * as fs from 'fs';
import * as path from 'path';

interface Button {
  text: string;
  callback_data: string;
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
      let target = el.callback_data.split("_to_")[1];
      if (!['back', 'backScreen'].includes(target)) {
        const importScreen = `import { ${target}Screen } from './${target}';`;
        if (!targetScreens.includes(importScreen))
        targetScreens.push(importScreen);
      }
    })
  })

  const inlineKeyboard = screen.inlineKeyboard.map((row, rowIndex) => {
    return `.addRow([${row.map((button, buttonIndex) => {
      return `keyboard[${rowIndex}][${buttonIndex}]`;
    }).join(', ')}])`;
  }).join('\n    ');

  
  const actions = screen.inlineKeyboard.map((row, rowIndex) => {
    return row.map((el, elIndex) => {
      let target = el.callback_data.split("_to_")[1];
      if (['back', 'backScreen'].includes(target)) {
        target = '\'backScreen\'';
      } else {
        target = `${target}Screen`;
      }
      return `{button: keyboard[${rowIndex}][${elIndex}], nextScreenCallback: ${target}}`;
    }).join(',\n    ')
  }).join(",\n    ");

  const currentScreen = targetScreens.length > 0 ? `, ${screenName}Screen` : '';

  return `
import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../InlineKeyboard';
import { editMessage } from '../Message';
import messages from '../messages.json';
import { CallbackAction, handleCallback, MessageScreen } from '../CallbackHandler';
${targetScreens.join('\n')}

const screen = messages.screens.${screenName};
const keyboard = screen.inlineKeyboard;

export async function ${screenName}Screen(messageScreen: MessageScreen) {
  const inlineKeyboard = new InlineKeyboard().addKeyboard(keyboard);
  const nextScreen = await editMessage(messageScreen, screen.text, inlineKeyboard);

  const actions: CallbackAction[] = [
    ${actions}
  ];

  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler${currentScreen});
  }

  messageScreen.bot.on('callback_query', callbackHandler);
}
`;
};

// Функция для генерации всех экранов
const generateScreens = (overwrite: boolean, excludeFiles: string[]) => {
  const screensDir = path.join(__dirname, 'screens');

  // Создаём директорию, если она не существует
  if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
  }

  console.log(`${overwrite} ${excludeFiles}`)
  // Если флаг перезаписи, удаляем старые файлы
  if (overwrite) {
    fs.readdirSync(screensDir).forEach(file => {
      if (!excludeFiles.includes(file)) {
        fs.unlinkSync(path.join(screensDir, file));
      }
    });
  }

  // Генерация новых экранов
  for (const [screenName, screen] of Object.entries(messages.screens)) {
    const fileName = `${screenName}.ts`;
    const filePath = path.join(screensDir, `${screenName}.ts`);
    const screenCode = generateScreenCode(screenName, screen);
    
    if (!fs.existsSync(filePath) || overwrite && !excludeFiles.includes(fileName)) {
      fs.writeFileSync(filePath, screenCode.trim());
      console.log(`Сгенерирован файл: ${filePath}`);
    } else {
      console.log(`Файл пропущен: ${filePath}`);
    }
  }
};

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const overwriteFlag = args.includes('-overwrite');
const excludeArgIndex = args.findIndex(arg => arg.startsWith('--exclude='));
const excludeFiles = excludeArgIndex !== -1
  ? args[excludeArgIndex].replace('--exclude=', '').split(' ')
  : [];
console.log(excludeFiles)
// Генерация экранов
generateScreens(overwriteFlag, excludeFiles);
