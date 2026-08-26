import Controller from "./Controller";

export interface PointerPosition {
  x: number;
  y: number;
}

export default class InputController extends Controller {
  readonly pointer: PointerPosition = { x: 0, y: 0 };
  private readonly keys = new Set<string>();

  isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  protected override onAttach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.scene.game.canvas.addEventListener("pointermove", this.handlePointerMove);
  }

  protected override onDetach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.scene.game.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.keys.clear();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.key);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const canvas = this.scene.game.canvas;
    const bounds = canvas.getBoundingClientRect();
    this.pointer.x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
    this.pointer.y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
  };
}
