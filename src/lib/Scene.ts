import Controller from "./controllers/Controller";
import EntityController from "./controllers/EntityController";
import InputController from "./controllers/InputController";
import type Game from "./Game";

export default class Scene {
  readonly entities = new EntityController();
  readonly input = new InputController();
  backgroundColor = "#000000";
  private readonly controllers = new Set<Controller>();
  private gameInstance: Game | undefined;
  private frameId: number | undefined;
  private lastTime: number | undefined;
  private created = false;

  constructor(readonly key: string) {
    this.addController(this.input);
  }

  get game(): Game {
    if (!this.gameInstance) {
      throw new Error(`Scene "${this.key}" has not been added to a game.`);
    }

    return this.gameInstance;
  }

  create(): void {}

  update(_time: number, _delta: number): void {}

  addController<T extends Controller>(controller: T): T {
    this.controllers.add(controller);

    if (this.gameInstance) {
      controller.attach(this);
    }

    return controller;
  }

  attach(game: Game): void {
    if (this.gameInstance && this.gameInstance !== game) {
      throw new Error(`Scene "${this.key}" already belongs to another game.`);
    }

    this.gameInstance = game;
    for (const controller of this.controllers) {
      controller.attach(this);
    }
  }

  start(): void {
    if (!this.created) {
      this.create();
      this.created = true;
    }

    if (this.frameId === undefined) {
      this.frameId = requestAnimationFrame(this.step);
    }
  }

  stop(): void {
    if (this.frameId !== undefined) {
      cancelAnimationFrame(this.frameId);
      this.frameId = undefined;
    }

    this.lastTime = undefined;
  }

  destroy(): void {
    this.stop();
    this.entities.clear();
    for (const controller of this.controllers) {
      controller.detach();
    }
  }

  private readonly step = (time: number): void => {
    const delta = this.lastTime === undefined ? 0 : time - this.lastTime;
    this.lastTime = time;

    for (const controller of this.controllers) {
      controller.update(time, delta);
    }

    this.update(time, delta);
    this.entities.update(time, delta);
    this.game.renderer.clear(this.backgroundColor);
    this.entities.render(this.game.renderer);
    this.frameId = requestAnimationFrame(this.step);
  };
}
