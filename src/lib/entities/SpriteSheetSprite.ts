import GameObject, { type ObjectConfig } from "../Object";
import SpriteSheet from "./SpriteSheet";

export interface SpriteSheetAnimationConfig {
  frames: readonly number[];
  frameDuration?: number;
  loop?: boolean;
}

export type SpriteSheetAnimations = Readonly<Record<string, SpriteSheetAnimationConfig>>;

export interface SpriteSheetSpriteConfig extends ObjectConfig {
  spriteSheet: SpriteSheet;
  frame: number;
  width?: number;
  height?: number;
  animations?: SpriteSheetAnimations;
}

export default class SpriteSheetSprite extends GameObject {
  readonly anims: SpriteSheetSpriteAnimations;
  readonly width: number;
  readonly height: number;
  private currentFrame: number;

  constructor({ spriteSheet, frame, width = spriteSheet.frameWidth, height = spriteSheet.frameHeight, animations = {}, hitArea, ...objectConfig }: SpriteSheetSpriteConfig) {
    if (width <= 0 || height <= 0) {
      throw new Error("SpriteSheetSprite dimensions must be positive.");
    }
    spriteSheet.at(frame);
    for (const animation of Object.values(animations)) {
      if (!animation.frames.length || !Number.isFinite(animation.frameDuration ?? 150) || (animation.frameDuration ?? 150) <= 0) {
        throw new Error("SpriteSheetSprite animations need frames and a positive frameDuration.");
      }
      for (const animationFrame of animation.frames) {
        spriteSheet.at(animationFrame);
      }
    }

    super({ ...objectConfig, hitArea: hitArea ?? { width, height } });
    this.spriteSheet = spriteSheet;
    this.currentFrame = frame;
    this.width = width;
    this.height = height;
    this.anims = new SpriteSheetSpriteAnimations(this, animations);
  }

  readonly spriteSheet: SpriteSheet;

  get frame(): number {
    return this.currentFrame;
  }

  override update(_time: number, delta: number): void {
    this.anims.update(delta);
  }

  override render(context: CanvasRenderingContext2D): void {
    const image = this.spriteSheet.image;
    if (!image.naturalWidth) {
      return;
    }

    const frame = this.spriteSheet.at(this.currentFrame);
    context.drawImage(
      image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      Math.round(this.position.x),
      Math.round(this.position.y),
      this.width,
      this.height,
    );
  }

  setFrame(frame: number): void {
    this.spriteSheet.at(frame);
    this.currentFrame = frame;
  }
}

export class SpriteSheetSpriteAnimations {
  private current: SpriteSheetAnimationConfig | undefined;
  private currentName: string | undefined;
  private frame = 0;
  private elapsed = 0;

  constructor(
    private readonly sprite: SpriteSheetSprite,
    private readonly animations: SpriteSheetAnimations,
  ) {}

  play(name: string): void {
    const animation = this.animations[name];
    if (!animation) {
      throw new Error(`Unknown SpriteSheetSprite animation "${name}".`);
    }

    if (this.currentName === name) {
      return;
    }

    this.current = animation;
    this.currentName = name;
    this.frame = 0;
    this.elapsed = 0;
    this.sprite.setFrame(animation.frames[0]!);
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
      this.sprite.setFrame(this.current.frames[this.frame]!);
    }
  }
}
