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
    const column = index % this.columns;
    const row = Math.floor(index / this.columns);
    return this.frames[row]![column]!;
  }
}
