import type Game from "../Game";
import type Scene from "../Scene";

export type SceneConstructor<T extends Scene = Scene> = new () => T;

export default class SceneController {
  private readonly sceneTypes = new Map<string, SceneConstructor>();
  private readonly sceneKeys: string[] = [];
  private currentScene: Scene | undefined;

  constructor(
    private readonly game: Game,
    scenes: SceneConstructor[],
  ) {
    for (const scene of scenes) {
      this.add(scene);
    }
  }

  get current(): Scene | undefined {
    return this.currentScene;
  }

  add<T extends Scene>(SceneType: SceneConstructor<T>): void {
    const key = new SceneType().key;

    if (this.sceneTypes.has(key)) {
      throw new Error(`A scene with key "${key}" already exists.`);
    }

    this.sceneTypes.set(key, SceneType);
    this.sceneKeys.push(key);
  }

  start<T extends Scene = Scene>(key: string, data?: any): T {
    const SceneType = this.sceneTypes.get(key);

    if (!SceneType) {
      throw new Error(`Unknown scene "${key}".`);
    }

    this.currentScene?.destroy();

    const scene = new SceneType();
    scene.attach(this.game);
    this.currentScene = scene;
    scene.start(data);
    return scene as T;
  }

  startFirst(): void {
    const key = this.sceneKeys[0];

    if (key) {
      this.start(key);
    }
  }

  destroy(): void {
    this.currentScene?.destroy();
    this.currentScene = undefined;
    this.sceneTypes.clear();
    this.sceneKeys.length = 0;
  }
}
