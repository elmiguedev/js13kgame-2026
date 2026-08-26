import GameObject, { type ObjectConfig } from "../Object";

export type PixelMatrix = readonly (readonly number[])[];
export type PixelPalette = Readonly<Record<number, string>>;

export interface PixelAnimationConfig {
  frames: readonly PixelMatrix[];
  frameDuration?: number;
  loop?: boolean;
}

export type PixelAnimations = Readonly<Record<string, PixelAnimationConfig>>;

export interface PixelSpriteConfig extends ObjectConfig {
  pixels: PixelMatrix;
  palette: PixelPalette;
  pixelSize?: number;
  animations?: PixelAnimations;
}

export default class PixelSprite extends GameObject {
  readonly anims: PixelSpriteAnimations;
  readonly palette: PixelPalette;
  readonly pixelSize: number;
  readonly width: number;
  readonly height: number;
  private currentPixels: PixelMatrix;

  constructor({ pixels, palette, pixelSize = 1, animations = {}, hitArea, ...objectConfig }: PixelSpriteConfig) {
    const columns = pixels[0]?.length;
    if (!columns || !pixels.length || pixels.some((row) => row.length !== columns)) {
      throw new Error("PixelSprite pixels must be a non-empty rectangular matrix.");
    }

    if (!Number.isInteger(pixelSize) || pixelSize < 1) {
      throw new Error("PixelSprite pixelSize must be a positive integer.");
    }

    const width = columns * pixelSize;
    const height = pixels.length * pixelSize;
    super({ ...objectConfig, hitArea: hitArea ?? { width, height } });
    this.validateAnimations(animations, pixels.length, columns);
    this.currentPixels = pixels;
    this.palette = palette;
    this.pixelSize = pixelSize;
    this.width = width;
    this.height = height;
    this.anims = new PixelSpriteAnimations(this, animations);
  }

  get pixels(): PixelMatrix {
    return this.currentPixels;
  }

  override update(_time: number, delta: number): void {
    this.anims.update(delta);
  }

  setPixels(pixels: PixelMatrix): void {
    this.currentPixels = pixels;
  }

  private validateAnimations(animations: PixelAnimations, rows: number, columns: number): void {
    for (const animation of Object.values(animations)) {
      if (!animation.frames.length || !Number.isFinite(animation.frameDuration ?? 150) || (animation.frameDuration ?? 150) <= 0) {
        throw new Error("PixelSprite animations need frames and a positive frameDuration.");
      }

      for (const frame of animation.frames) {
        if (frame.length !== rows || frame.some((row) => row.length !== columns)) {
          throw new Error("PixelSprite animation frames must match the base matrix dimensions.");
        }
      }
    }
  }
}

export class PixelSpriteAnimations {
  private current: PixelAnimationConfig | undefined;
  private currentName: string | undefined;
  private frame = 0;
  private elapsed = 0;

  constructor(
    private readonly sprite: PixelSprite,
    private readonly animations: PixelAnimations,
  ) {}

  play(name: string): void {
    const animation = this.animations[name];
    if (!animation) {
      throw new Error(`Unknown PixelSprite animation "${name}".`);
    }

    if (this.currentName === name) {
      return;
    }

    this.current = animation;
    this.currentName = name;
    this.frame = 0;
    this.elapsed = 0;
    this.sprite.setPixels(animation.frames[0]!);
  }

  update(delta: number): void {
    if (!this.current || !Number.isFinite(delta)) {
      return;
    }

    this.elapsed += delta;
    const frameDuration = this.current.frameDuration ?? 150;
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      if (this.frame === this.current.frames.length - 1 && !this.current.loop) {
        this.elapsed = 0;
        return;
      }

      this.frame = (this.frame + 1) % this.current.frames.length;
      this.sprite.setPixels(this.current.frames[this.frame]!);
    }
  }
}
