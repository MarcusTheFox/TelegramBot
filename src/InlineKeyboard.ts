import { Button } from './Button';

type ButtonInput = Button | { text: string; callback_data: string; data?: object};

export class InlineKeyboard {
  public keyboard: Array<Array<Button>> = [];

  public addRow(buttons: Array<ButtonInput>): this {
    const buttonRow: Array<Button> = buttons.map((button) => {
      if (button instanceof Button) {
        return button;
      }

      return new Button(button.text, button.callback_data, button.data);
    });

    this.keyboard.push(buttonRow);
    return this; // Возвращаем текущий объект для поддержки цепочки вызовов
  }

  public updateRow(rowIndex: number, buttons: Button[]): this {
    if (rowIndex < 0 || rowIndex >= this.keyboard.length) {
      throw new Error("Invalid row index");
    }
    this.keyboard[rowIndex] = buttons;
    return this; // Возвращаем текущий объект для поддержки цепочки вызовов
  }


  public addKeyboard(keyboard: Array<Array<Button>>): this {
    this.keyboard.push(...keyboard);
    return this;
  }

  // Получение объекта для reply_markup
  public get layout() {
    return {
      reply_markup: {
        inline_keyboard: this.keyboard.map(row => row.map(button => ({
          text: button.text,
          callback_data: button.callback_data,
        }))),
      },
    };
  }
}
