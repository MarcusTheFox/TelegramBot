import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../../InlineKeyboard';
import { editMessage } from '../../Message';
import { CallbackAction, handleCallback, MessageScreen } from '../../CallbackHandler';
import { Button } from '../../Button';
import GameModel from '../../models/Game';
import { getPlayerName } from '../../functoins/userFL';

enum GameStatus {
  Begin,
  InProgress,
  End
}

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
    hand: deck.splice(0, 5), // Раздаем по 5 карт
    order: index,
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

  const currentPlayer = game.players[game.currentPlayerIndex];
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
    return { name: await getPlayerName(bot, player.chatId), id: player.chatId }
  }));
  const playerListText = playerList
  .map(player => {
    // Если это текущий игрок, выделяем его с помощью эмодзи
    const isCurrentPlayer = player.id === currentPlayer.chatId;
    return isCurrentPlayer
      ? `▶️ *${player.name}*`
      : `⬜️ ${player.name}`;
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
          game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
          await game.save();

          bot.emit("screen_update");
        }
      },
      {button: inlineKeyboard.keyboard[2][0], nextScreenCallback: async () => {}}
    )
  }

  const screenUpdate = () => {
    bot.removeListener('screen_update', screenUpdate);
    bot.removeListener('callback_query', callbackHandler);
    gameLiarsBarCard(nextScreen);
  }
  
  function callbackHandler(callbackQuery: TelegramBot.CallbackQuery) {
    handleCallback(nextScreen, callbackQuery, actions, callbackHandler, undefined, false);
  }

  bot.on('callback_query', callbackHandler);
  bot.on('screen_update', screenUpdate);
}