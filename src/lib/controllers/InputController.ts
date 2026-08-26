import Controller from "./Controller";
import KeyboardController from "./KeyboardController";
import MouseController from "./MouseController";

export default class InputController extends Controller {
  readonly keyboard = new KeyboardController();
  readonly mouse = new MouseController();

  protected override onAttach(): void {
    this.keyboard.attach(this.scene);
    this.mouse.attach(this.scene);
  }

  protected override onDetach(): void {
    this.keyboard.detach();
    this.mouse.detach();
  }
}
