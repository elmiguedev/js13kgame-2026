export const GEM_COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"] as const;
export const DOOR_GEM_COLORS = GEM_COLORS.slice(0, -1);

export type GemColor = typeof GEM_COLORS[number];

export function isGemColor(value: unknown): value is GemColor {
  return typeof value === "string" && GEM_COLORS.includes(value as GemColor);
}
