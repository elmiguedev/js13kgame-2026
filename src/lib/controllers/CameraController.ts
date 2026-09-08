import type Position from "../common/Position";
import type GameObject from "../Object";
import Controller from "./Controller";

export default class CameraController extends Controller {
  readonly position: Position = { x: 0, y: 0 };
  private zoom = 1;
  private target: GameObject | undefined;

  startFollow<T extends GameObject>(target: T): T {
    this.target = target;
    return target;
  }

  stopFollow(): void {
    this.target = undefined;
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  get scale(): number {
    return this.zoom;
  }

  get offset(): Position | undefined {
    if (!this.target) {
      return undefined;
    }

    const canvas = this.scene.game.canvas;
    return {
      x: Math.round(canvas.width / 2 - this.position.x * this.zoom),
      y: Math.round(canvas.height / 2 - this.position.y * this.zoom),
    };
  }

  screenToWorld(position: Position): Position {
    const offset = this.offset;
    return offset
      ? { x: (position.x - offset.x) / this.zoom, y: (position.y - offset.y) / this.zoom }
      : position;
  }

  override update(): void {
    if (!this.target) {
      return;
    }

    this.position.x = this.target.position.x + (this.target.hitArea?.width ?? 0) / 2;
    this.position.y = this.target.position.y + (this.target.hitArea?.height ?? 0) / 2;
  }
}
