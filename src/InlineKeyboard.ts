import { Button } from './Button';

type ButtonInput = Button | { text: string; data: string };

export class InlineKeyboard {
  private keyboard: Array<Array<Button>> = [];

  public addRow(buttons: Array<ButtonInput>): this {
    const buttonRow: Array<Button> = buttons.map((button) => {
      if (button instanceof Button) {
        return button;
      }

      return new Button(button.text, button.data);
    });

    this.keyboard.push(buttonRow);
    return this; // Возвращаем текущий объект для поддержки цепочки вызовов
  }

  // Получение объекта для reply_markup
  public get layout() {
    return {
      reply_markup: {
        inline_keyboard: this.keyboard.map(row => row.map(button => ({
          text: button.text,
          callback_data: button.data,
        }))),
      },
    };
  }
}
