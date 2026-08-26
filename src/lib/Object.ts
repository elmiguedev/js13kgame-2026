import type Position from "./common/Position";

export interface Size {
  width: number;
  height: number;
}

export interface ObjectConfig {
  id?: string;
  x?: number;
  y?: number;
  hitArea?: Size;
  onClick?: () => void;
}

let nextObjectId = 0;

export default class Object {
  readonly id: string;
  readonly position: Position;
  readonly hitArea: Size | undefined;
  onClick: (() => void) | undefined;

  constructor({ id, x, y, hitArea, onClick }: ObjectConfig = {}) {
    this.id = id ?? `object-${nextObjectId++}`;
    this.position = { x: x ?? 0, y: y ?? 0 };
    this.hitArea = hitArea;
    this.onClick = onClick;
  }

  update(_time: number, _delta: number): void { }

  render(_context: CanvasRenderingContext2D): void { }

  containsPoint(x: number, y: number): boolean {
    return Boolean(
      this.hitArea
      && x >= this.position.x
      && x <= this.position.x + this.hitArea.width
      && y >= this.position.y
      && y <= this.position.y + this.hitArea.height,
    );
  }

  focus(): void { }

  blur(): void { }

  handleKey(_key: string): void { }

  destroy(): void { }
}
