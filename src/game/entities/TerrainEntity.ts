import GameObject from "../../lib/Object";
import SpriteSheet from "../../lib/entities/SpriteSheet";

export default class TerrainEntity extends GameObject {
  private static readonly size = 150;
  private raster: HTMLCanvasElement | undefined;

  constructor(private readonly spriteSheet: SpriteSheet, private terrainSeed: number) {
    super({ id: "terrain" });
  }

  updateSeed(terrainSeed: number): void {
    if (this.terrainSeed !== terrainSeed) {
      this.terrainSeed = terrainSeed;
      this.raster = undefined;
    }
  }

  override render(context: CanvasRenderingContext2D): void {
    const raster = this.getRaster();
    if (raster) {
      context.drawImage(raster, 0, 0);
    }
  }

  private getRaster(): HTMLCanvasElement | undefined {
    if (this.raster) {
      return this.raster;
    }

    const image = this.spriteSheet.image;
    if (!image.naturalWidth) {
      return undefined;
    }

    const canvas = document.createElement("canvas");
    canvas.width = TerrainEntity.size * 8;
    canvas.height = TerrainEntity.size * 8;
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    context.imageSmoothingEnabled = false;
    for (let y = 0; y < TerrainEntity.size; y += 1) {
      for (let x = 0; x < TerrainEntity.size; x += 1) {
        const tile = this.getTile(x, y);
        if (tile === undefined) {
          continue;
        }
        const frame = this.spriteSheet.at(40 + tile);
        context.drawImage(image, frame.x, frame.y, frame.width, frame.height, x * 8, y * 8, 8, 8);
      }
    }
    this.raster = canvas;
    return canvas;
  }

  private getTile(x: number, y: number): number | undefined {
    let value = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ this.terrainSeed;
    value = Math.imul(value ^ value >>> 13, 1274126177);
    const tile = value >>> 0;
    return tile % 16 === 0 ? Math.floor(tile / 16) % 4 : undefined;
  }
}
