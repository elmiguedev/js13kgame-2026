export const GEM_COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"] as const;
export const DOOR_GEM_COLORS = GEM_COLORS.slice(0, -1);
export const GEM_LIGHT_COLORS: Record<GemColor, string> = {
  red: "#ff4040",
  orange: "#ff8a30",
  yellow: "#fff040",
  green: "#40e060",
  blue: "#4080ff",
  indigo: "#8040d0",
  violet: "#d060ff",
};

export type GemColor = typeof GEM_COLORS[number];

export function isGemColor(value: unknown): value is GemColor {
  return typeof value === "string" && GEM_COLORS.includes(value as GemColor);
}
