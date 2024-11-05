/**
 * Кнопка на inline-клавиатуре.
 * @param text - Надпись на кнопке.
 * @param data - Callback-data, отправляемые при нажатии.
 */
export class Button {
    constructor(public readonly text: string, public readonly data: string) {}
}
  