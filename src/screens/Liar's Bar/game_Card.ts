import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../../InlineKeyboard';
import { editMessage } from '../../Message';
import { CallbackAction, handleCallback, MessageScreen } from '../../CallbackHandler';
import { Button } from '../../Button';
import GameModel from '../../models/Game';
import { getPlayerName } from '../../functoins/userFL';
import { startScreen } from '../start';
import RoomModel from '../../models/Room';
import { RandomNumber, WaitForMilliseconds } from '../../functoins/globalFL';

const max_players_in_game: number = 4;

export async function initializeGame(room: any, bot: TelegramBot) {
  let cards: string[] = ["🤡", "🤡"];
  for (let _ = 0; _ < 6; _++) {
    cards.push("A");
    cards.push("K");
    cards.push("Q");
  }
  const deck = shuffleDeck(cards);

  const table = shuffleDeck(["A", "K", "Q"])[0];

  const players = room.players.map((chatId: number, index: number) => ({
    chatId,
    hand: index < max_players_in_game ? deck.splice(0, 5) : [], // Раздаем по 5 карт
    loseCount: 0,
    spectator: index < max_players_in_game ? false : true,
    order: index < max_players_in_game ? index : -1,
  }));

  const game = new GameModel({
    roomCode: room.code,
    table,
    deck, // Оставшиеся карты
    players,
    currentPlayerIndex: 0, // Первый ход у первого игрока
  });

  await game.save();
}

function shuffleDeck(deck: string[]): string[] {
  return deck.sort(() => Math.random() - 0.5);
}

const tableNames = {
  "A": "Тузов",
  "K": "Королей",
  "Q": "Дам"
};

export default async function gameLiarsBarCard(messageScreen: MessageScreen) {
  const bot = messageScreen.bot;
  const chatId = messageScreen.chatId;

  const game = await GameModel.findOne({ roomCode: messageScreen.data?.code });
  if (!game) throw new Error("Game not found.");

  const currentPlayer = game.players.filter((p) => p.spectator === false)[game.currentPlayerIndex];
  const playerData = game.players.find((p) => p.chatId === chatId);

  if (!playerData) throw new Error("Player not found in this game.");

  const myTurn = currentPlayer.chatId === chatId;
  const cards: Button[] = [];

  playerData.hand.forEach((card, index) => {
    cards.push({
      text: card,
      callback_data: `select_card_${index}`,
      data: { selected: false },
    });
  });

  const inlineKeyboard = new InlineKeyboard();

  inlineKeyboard.addRow(cards);
  if (myTurn) {
    inlineKeyboard.addRow([{text: "Бросить карты", callback_data: "send_cards", data: {}}]);
    inlineKeyboard.addRow([{text: "ЛЖЁШЬ", callback_data: "say_liar", data: {}}]);
  }

  const playerList = await Promise.all(game.players.map(async player => {
    return { 
      name: await getPlayerName(bot, player.chatId), 
      id: player.chatId, 
      loseCount: player.loseCount,
      spectator: player.spectator,
    }
  }));
  const playerListText = playerList
  .map(player => {
    // Если это текущий игрок, выделяем его с помощью эмодзи
    const isCurrentPlayer = player.id === currentPlayer.chatId;
    return isCurrentPlayer
      ? `▶️ *${player.name} \\(${player.loseCount} : 6\\)*`
      : `⬜️ ${player.spectator ? "~" : ""}${player.name} \\(${player.loseCount} : 6\\)${player.spectator ? "~" : ""}`;
  })
  .join("\n");

  const playedCards = game.turnHistory.at(-1);
  const playedCardsText = playedCards 
                          ? `*${await getPlayerName(bot, playedCards.playerId)}* \\- ${game.table} *x${playedCards.playedCards.length}*\n`
                          : ""
  
  const screenText = `
🎲 Стол *${tableNames[game.table]}* 🎲
${playedCardsText}
🎮 *Игроки*:
${playerListText}

  `;
  const nextScreen = await editMessage(messageScreen, screenText, inlineKeyboard, 'MarkdownV2');

  const actions: CallbackAction[] = [];
  for (let i = 0; i < inlineKeyboard.keyboard[0].length; i++) {
    actions.push({button: inlineKeyboard.keyboard[0][i], nextScreenCallback: async () => {
      cards[i].data = {...cards[i].data, selected: !cards[i].data?.selected};
      cards[i].text = cards[i].data?.selected 
                      ? `🔸${cards[i].text}`
                      : cards[i].text.replace("🔸", "");
      inlineKeyboard.updateRow(0, cards);
      await editMessage(nextScreen, screenText, inlineKeyboard, 'MarkdownV2');
    }});
  }
  if (myTurn) {
    actions.push(
      {
        button: inlineKeyboard.keyboard[1][0], 
        nextScreenCallback: async () => {
          // Получаем выбранные карты
          const selectedCards = cards.filter((card) => card.data?.selected);

          if (selectedCards.length === 0) {
            // Если карты не выбраны, игнорируем действие
            await editMessage(nextScreen, screenText + "Выберите карты перед броском\\!", inlineKeyboard, 'MarkdownV2');
            return;
          }
    
          // Убираем выбранные карты из руки игрока
          playerData.hand = playerData.hand.filter(
            (card, index) => {
              return cards[index].text === card;
            }
          );
    
          // Добавляем их на стол
          game.turnHistory.push({playerId: chatId, playedCards: selectedCards.map((card) => card.text.replace("🔸", ""))});
    
          // Сохраняем изменения в базе
          await game.save();
    
          // Передача хода следующему игроку
          game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.filter((p) => p.spectator === false).length;
          await game.save();

          bot.emit("screen_update");
        }
      },
      {button: inlineKeyboard.keyboard[2][0], nextScreenCallback: async () => {
        if (game.turnHistory.length === 0) {
          await editMessage(nextScreen, screenText + "До вас еще никто не ходил\\!", inlineKeyboard, 'MarkdownV2');
          return;
        }
        const lastTurn = game.turnHistory.at(-1);
        if (!lastTurn) return;

        game.liarCall = {
          accusedId: lastTurn.playerId, // Обвиняемый — тот, кто сделал последний ход
          accuserId: messageScreen.chatId, // Обвинитель — текущий игрок
        };
  
        await game.save();
  
        // Формируем сообщение о вызове
        const accusedName = await getPlayerName(bot, game.liarCall.accusedId);
        const accuserName = await getPlayerName(bot, game.liarCall.accuserId);
  
        const liarCallText = `
🚨 *Обвинение в обмане*\\! 🚨

👤 *${accuserName}* утверждает, что *${accusedName}* обманул\\.

🤔 Проверяем карты ${accusedName}\\.\\.\\. 
`;
        bot.emit('liar_event', { liarCallText: liarCallText });
        await WaitForMilliseconds(3000); // Пауза 3 секунды
  
        let loserId: number;
        let loserName: string;
        // Проверяем карты обвиняемого
        const accusedCardsAreValid = lastTurn.playedCards.every(card => card === game.table || card === '🤡');
        // Сообщение о результатах
        if (accusedCardsAreValid) {
          const failText = `
❌ *${accuserName}* ошибся\\! Карты ${accusedName} соответствуют столу\\.

🙅‍♂️ *${accuserName}* испытает удачу остаться в игре\\.
          `;
          loserId = game.liarCall.accuserId;
          loserName = accuserName;
          bot.emit('liar_event', { resultText: failText });
          await WaitForMilliseconds(3000);
        } else {
          const successText = `
✅ *${accusedName}* обманул\\! Карты не соответствуют столу\\.

🙅‍♂️ *${accusedName}* испытает удачу остаться в игре\\.
          `;
          loserId = game.liarCall.accusedId;
          loserName = accusedName;
          bot.emit('liar_event', { resultText: successText });
          await WaitForMilliseconds(3000);
        }

        const loserPlayer = game.players.find((p) => p.chatId === loserId);
        if (!loserPlayer) return;

        let luckText: string;
        if (RandomNumber(1, 6) > ++loserPlayer.loseCount) {
          luckText = `
🍀 УСПЕХ\\!\\!\\! 🍀

Игрок *${loserName}* остается в игре\\.
Он потратил попыток: ${loserPlayer.loseCount} из 6
          `
        } else {
          luckText = `
😞 Неудача\\.\\.\\.

Игрок *${loserName}* становится наблюдателем\\.
Он потратил попыток: ${loserPlayer.loseCount} из 6
          `
          loserPlayer.spectator = true;
        }
        game.save();

        const playersInGame = game.players.filter((p) => p.spectator === false)
        const isLastPlayerLeft = playersInGame.length < 2;

        bot.emit('liar_event', { luckText: luckText, isLast: isLastPlayerLeft });
        await WaitForMilliseconds(3000);

        if (isLastPlayerLeft) {
          const winnerName = await getPlayerName(messageScreen.bot, playersInGame[0].chatId);
          const finalText = `
Игра окончена\\.
Победитель *${winnerName}*
          `
          bot.emit('liar_event', { finalText: finalText });
          await GameModel.deleteOne({ roomCode: messageScreen.data?.code })
          await RoomModel.deleteOne({ code: messageScreen.data?.code })
        } else {
          resetTable(game);
          await game.save();
        }
      }}
    )
  }
  
  function resetTable(game: any) {
    let cards: string[] = ["🤡", "🤡"];
    for (let _ = 0; _ < 6; _++) {
      cards.push("A");
      cards.push("K");
      cards.push("Q");
    }
    const deck = shuffleDeck(cards);

    const table = shuffleDeck(["A", "K", "Q"])[0];

    let index: number = 0;
    const players = game.players.map((player: any) => {
      player = {
        ...player, 
        order: player.spectator ? -1 : index++,
        hand: player.spectator ? [] : deck.splice(0, 5)
      };
      return player;
    });

    const playersInGame: number = game.players.filter((p: any) => p.spectator === false).length;
    const currentPlayer: number = RandomNumber(0, playersInGame - 1);

    game.turnHistory = undefined;
    game.table = table;
    game.deck = deck;
    game.players = players;
    game.currentPlayerIndex = currentPlayer;
  }

  const screenUpdate = () => {
    bot.removeListener('screen_update', screenUpdate);
    bot.removeListener('callback_query', callbackHandler);
    bot.removeListener('liar_event', liarEvent);
    gameLiarsBarCard(nextScreen);
  }

  const liarEvent = async (callback_data: any) => {
    bot.removeListener('screen_update', screenUpdate);
    bot.removeListener('callback_query', callbackHandler);

    const { 
      liarCallText, 
      resultText, 
      luckText,
      isLast,
      finalText } = callback_data
    if (liarCallText) {
      await editMessage(nextScreen, liarCallText, new InlineKeyboard(), 'MarkdownV2');
    }
    if (resultText) {
      // Используем асинхронные паузы для последовательного обновления
      await editMessage(nextScreen, resultText, new InlineKeyboard(), 'MarkdownV2');
    }
    if (luckText) {
      await editMessage(nextScreen, luckText, new InlineKeyboard(), 'MarkdownV2');
      
      if (!isLast) {
        await WaitForMilliseconds(3000);
        await editMessage(nextScreen, 'Обновляем стол', new InlineKeyboard(), 'MarkdownV2');
        await WaitForMilliseconds(3000);
        bot.removeListener('liar_event', liarEvent);
        gameLiarsBarCard(nextScreen);
      }
    }
    if (finalText) {
      await editMessage(nextScreen, finalText, new InlineKeyboard(), 'MarkdownV2');
      // Ещё одна пауза перед возвратом на стартовый экран
      await WaitForMilliseconds(3000);
      bot.removeListener('liar_event', liarEvent);
      startScreen({ ...nextScreen, fromScreen: [] });
    }
  }
  
  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler, undefined, false);
  }

  bot.on('callback_query', callbackHandler);
  bot.on('screen_update', screenUpdate);
  bot.on('liar_event', liarEvent);
}

async function throwDice(messageScreen: MessageScreen) {
  const bot = messageScreen.bot;
  const chatId = messageScreen.chatId;
  const dice = await bot.sendDice(chatId);
}