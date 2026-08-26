import Controller from "./controllers/Controller";
import EntityController from "./controllers/EntityController";
import InputController from "./controllers/InputController";
import type SceneController from "./controllers/SceneController";
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
  private active = false;

  constructor(readonly key: string) {
    this.addController(this.input);
  }

  get game(): Game {
    if (!this.gameInstance) {
      throw new Error(`Scene "${this.key}" has not been added to a game.`);
    }

    return this.gameInstance;
  }

  get scene(): SceneController {
    return this.game.scene;
  }

  init(_data?: any): void {}

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

  start(data?: any): void {
    this.active = true;
    this.init(data);

    if (!this.active) {
      return;
    }

    if (!this.created) {
      this.create();
      this.created = true;
    }

    if (this.frameId === undefined) {
      this.frameId = requestAnimationFrame(this.step);
    }
  }

  stop(): void {
    this.active = false;

    if (this.frameId !== undefined) {
      cancelAnimationFrame(this.frameId);
      this.frameId = undefined;
    }

    this.lastTime = undefined;
  }

  destroy(): void {
    this.stop();
    this.entities.destroy();
    for (const controller of this.controllers) {
      controller.detach();
    }
  }

  private readonly step = (time: number): void => {
    this.frameId = undefined;

    if (!this.active) {
      return;
    }

    const delta = this.lastTime === undefined ? 0 : time - this.lastTime;
    this.lastTime = time;

    for (const controller of this.controllers) {
      controller.update(time, delta);
    }

    if (!this.active) {
      return;
    }

    this.update(time, delta);

    if (!this.active) {
      return;
    }

    this.entities.update(time, delta);
    this.game.renderer.clear(this.backgroundColor);
    this.entities.render(this.game.renderer);

    if (this.active) {
      this.frameId = requestAnimationFrame(this.step);
    }
  };
}
