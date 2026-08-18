export type NavItem = "feed" | "ninos" | "avisos" | "cuenta";

export interface LinkedParent {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  role: "mom" | "dad" | "guardian";
  roleLabel: string;
  status: "active" | "pending";
  statusLabel: string;
}

export interface Child {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  ageYears: number;
  birthdateLabel: string;
  room: string;
  admissionLabel: string;
  allergens: string[];
  allergyNotes?: string;
  linkedParents: LinkedParent[];
}
