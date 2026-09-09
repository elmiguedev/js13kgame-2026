import GameObject from "../../lib/Object";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import { GEM_COLORS, type GemColor } from "../domain/GemColor";

export default class GemHudEntity extends GameObject {
  private gems: readonly GemColor[] = [];

  constructor(private readonly spriteSheet: SpriteSheet) {
    super({ id: "gem-hud", x: 4, y: 4, fixedToScreen: true });
  }

  updateGems(gems: readonly GemColor[]): boolean {
    const gainedGem = gems.length > this.gems.length;
    this.gems = gems;
    return gainedGem;
  }

  override render(context: CanvasRenderingContext2D): void {
    const image = this.spriteSheet.image;
    if (!image.naturalWidth) {
      return;
    }

    for (const [index, gem] of this.gems.entries()) {
      const frame = this.spriteSheet.at(24 + GEM_COLORS.indexOf(gem));
      context.drawImage(image, frame.x, frame.y, frame.width, frame.height, this.position.x + index * 8, this.position.y, 8, 8);
    }
  }
}
