import SceneController, { type SceneConstructor } from "./controllers/SceneController";
import CanvasRenderer from "./renderers/CanvasRenderer";

export interface GameConfig {
  resolution: {
    width: number;
    height: number;
  };
  scenes: SceneConstructor[];
  canvas?: HTMLCanvasElement;
  parent?: HTMLElement;
  zoom?: number;
  pixelArt?: boolean;
}

export default class Game {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: CanvasRenderer;
  readonly zoom: number;
  readonly scene: SceneController;

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

    this.scene = new SceneController(this, scenes);
    this.scene.startFirst();
  }

  destroy(): void {
    this.scene.destroy();
    this.renderer.destroy();
    this.canvas.remove();
  }
}
