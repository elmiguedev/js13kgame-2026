import type Position from "../common/Position";
import Controller from "./Controller";

export default class MouseController extends Controller {
  readonly position: Position = { x: 0, y: 0 };
  private readonly buttons = new Set<number>();
  private clickPosition: Position | undefined;

  isButtonDown(button: number): boolean {
    return this.buttons.has(button);
  }

  consumeClick(): Position | undefined {
    const click = this.clickPosition;
    this.clickPosition = undefined;
    return click;
  }

  protected override onAttach(): void {
    const canvas = this.scene.game.canvas;
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerUp);
  }

  protected override onDetach(): void {
    const canvas = this.scene.game.canvas;
    canvas.removeEventListener("pointermove", this.handlePointerMove);
    canvas.removeEventListener("pointerdown", this.handlePointerDown);
    canvas.removeEventListener("pointerup", this.handlePointerUp);
    canvas.removeEventListener("pointercancel", this.handlePointerUp);
    this.buttons.clear();
    this.clickPosition = undefined;
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const canvas = this.scene.game.canvas;
    const bounds = canvas.getBoundingClientRect();
    this.position.x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
    this.position.y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.buttons.add(event.button);
    this.handlePointerMove(event);
    if (event.button === 0) {
      this.clickPosition = { ...this.position };
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.buttons.delete(event.button);
    this.handlePointerMove(event);
  };
}
