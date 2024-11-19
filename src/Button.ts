/**
 * Кнопка на inline-клавиатуре.
 * @param text - Надпись на кнопке.
 * @param callback_data - Callback-data, отправляемые при нажатии.
 */
export class Button {
  constructor(public readonly text: string, public readonly callback_data: string, public readonly data?: ButtonData) {}
}

export type ButtonData = {
  [key in 
    "game" | 
    "mode"
  ]?: string | number | boolean | object;
};