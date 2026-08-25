export const ROOMS = ["Terra", "Sol", "Luna"] as const;
export type Room = (typeof ROOMS)[number];
