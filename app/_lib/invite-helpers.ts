export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface InvitationPreview {
  status: InvitationStatus;
  code: string;
  full_name: string;
  email: string;
  child_name: string;
  room_name: string;
  avatar_initial: string;
  daycare_id: string;
}

export const ROLES = [
  { value: "mom" as const, label: "Mamá" },
  { value: "dad" as const, label: "Papá" },
  { value: "guardian" as const, label: "Tutor/a" },
] as const;

export const ROLE_LABELS: Record<string, string> = {
  mom: "Mamá",
  dad: "Papá",
  guardian: "Tutor/a",
};

export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}
