import CanvasRenderer from "./renderers/CanvasRenderer";
import type Scene from "./Scene";

export interface GameConfig {
  resolution: {
    width: number;
    height: number;
  };
  scenes: Scene[];
  canvas?: HTMLCanvasElement;
  parent?: HTMLElement;
  zoom?: number;
  pixelArt?: boolean;
}

export default class Game {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: CanvasRenderer;
  readonly zoom: number;
  private readonly scenes = new Map<string, Scene>();
  private currentScene: Scene | undefined;

  constructor({ canvas, parent = document.body, resolution, scenes, zoom = 1, pixelArt = true }: GameConfig) {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      throw new Error("Zoom must be greater than zero.");
    }

    this.canvas = canvas ?? document.createElement("canvas");
    this.canvas.width = resolution.width;
    this.canvas.height = resolution.height;
    this.canvas.style.width = `${resolution.width * zoom}px`;
    this.canvas.style.height = `${resolution.height * zoom}px`;
    this.zoom = zoom;

    if (!canvas) {
      parent.append(this.canvas);
    }

    this.renderer = new CanvasRenderer(this.canvas, { pixelArt });

    for (const scene of scenes) {
      this.addScene(scene);
    }

    const firstScene = scenes[0];
    if (firstScene) {
      this.startScene(firstScene.key);
    }
  }

  addScene<T extends Scene>(scene: T): T {
    if (this.scenes.has(scene.key)) {
      throw new Error(`A scene with key "${scene.key}" already exists.`);
    }

    scene.attach(this);
    this.scenes.set(scene.key, scene);
    return scene;
  }

  getScene<T extends Scene = Scene>(key: string): T | undefined {
    return this.scenes.get(key) as T | undefined;
  }

  startScene(key: string): void {
    const scene = this.scenes.get(key);

    if (!scene) {
      throw new Error(`Unknown scene "${key}".`);
    }

    this.currentScene?.stop();
    this.currentScene = scene;
    scene.start();
  }

  destroy(): void {
    this.currentScene?.stop();
    for (const scene of this.scenes.values()) {
      scene.destroy();
    }

    this.scenes.clear();
    this.renderer.destroy();
    this.canvas.remove();
  }
}
