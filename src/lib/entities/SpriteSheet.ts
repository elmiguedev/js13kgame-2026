export interface SpriteSheetFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class SpriteSheet {
  readonly image = new Image();
  readonly frames: readonly (readonly SpriteSheetFrame[])[];

  constructor(
    src: string,
    readonly frameWidth: number,
    readonly frameHeight: number,
    readonly columns: number,
    readonly rows: number,
  ) {
    if (![frameWidth, frameHeight, columns, rows].every((value) => Number.isInteger(value) && value > 0)) {
      throw new Error("SpriteSheet dimensions must be positive integers.");
    }

    this.frames = Array.from({ length: rows }, (_row, y) => (
      Array.from({ length: columns }, (_column, x) => ({
        x: x * frameWidth,
        y: y * frameHeight,
        width: frameWidth,
        height: frameHeight,
      }))
    ));
    this.image.src = src;
  }

  at(index: number): SpriteSheetFrame {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`Invalid sprite sheet frame index ${index}.`);
    }

    const column = index % this.columns;
    const row = Math.floor(index / this.columns);
    const frame = this.frames[row]?.[column];
    if (!frame) {
      throw new Error(`Unknown sprite sheet frame index ${index}.`);
    }

    return frame;
  }
}
