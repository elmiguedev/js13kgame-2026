import type Position from "./Position";

export default function smoothPosition(
  position: Position,
  target: Position,
  delta: number,
  speed: number,
): void {
  const factor = 1 - Math.exp(-speed * delta / 1000);
  position.x += (target.x - position.x) * factor;
  position.y += (target.y - position.y) * factor;

  if (Math.abs(target.x - position.x) < 0.01) {
    position.x = target.x;
  }
  if (Math.abs(target.y - position.y) < 0.01) {
    position.y = target.y;
  }
}
