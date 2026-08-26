import type Scene from "../Scene";

export default class Controller {
  protected scene!: Scene;
  private attached = false;

  attach(scene: Scene): void {
    if (this.attached) {
      throw new Error("A controller can only be attached to one scene.");
    }

    this.scene = scene;
    this.attached = true;
    this.onAttach();
  }

  detach(): void {
    if (!this.attached) {
      return;
    }

    this.onDetach();
    this.attached = false;
  }

  update(_time: number, _delta: number): void {}

  protected onAttach(): void {}

  protected onDetach(): void {}
}
