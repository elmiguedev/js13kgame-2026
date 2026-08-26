import CameraController from "./controllers/CameraController";
import Controller from "./controllers/Controller";
import EntityController from "./controllers/EntityController";
import InputController from "./controllers/InputController";
import type SceneController from "./controllers/SceneController";
import type Game from "./Game";
import type GameObject from "./Object";
import type Position from "./common/Position";

export default class Scene {
  readonly entities = new EntityController();
  readonly input = new InputController();
  readonly camera = new CameraController();
  backgroundColor = "#000000";
  private readonly controllers = new Set<Controller>();
  private gameInstance: Game | undefined;
  private frameId: number | undefined;
  private lastTime: number | undefined;
  private created = false;
  private active = false;
  private focusedObject: GameObject | undefined;

  constructor(readonly key: string) {
    this.addController(this.input);
    this.addController(this.camera);
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

  handleClick(_position: Position, _clickedObject: GameObject | undefined): void {}

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
    this.shutdown();
    this.entities.destroy();
    for (const controller of this.controllers) {
      controller.detach();
    }
  }

  shutdown(): void {}

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

    const click = this.input.mouse.consumeClick();
    if (click) {
      const worldClick = this.camera.screenToWorld(click);
      const clickedObject = this.entities.click(worldClick);
      if (clickedObject !== this.focusedObject) {
        this.focusedObject?.blur();
        this.focusedObject = clickedObject;
        this.focusedObject?.focus();
      }
      this.handleClick(worldClick, clickedObject);
    }

    for (const key of this.input.keyboard.consumeKeyPresses()) {
      this.focusedObject?.handleKey(key);
    }

    this.update(time, delta);

    if (!this.active) {
      return;
    }

    this.entities.update(time, delta);
    this.game.renderer.clear(this.backgroundColor);
    const cameraOffset = this.camera.offset;
    if (cameraOffset) {
      this.game.renderer.pushTransform(cameraOffset.x, cameraOffset.y);
    }
    this.entities.render(this.game.renderer);
    if (cameraOffset) {
      this.game.renderer.popTransform();
    }

    if (this.active) {
      this.frameId = requestAnimationFrame(this.step);
    }
  };
}
