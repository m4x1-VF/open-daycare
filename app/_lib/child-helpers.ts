import { Child } from "@/app/_lib/child-types";
import { DbChild } from "@/app/_lib/db-types";

export const AVATAR_POOL = [
  { bg: "#A9D9E8", color: "#1F7A93" },
  { bg: "#F4B8CC", color: "#C44A7A" },
  { bg: "#B9DEC4", color: "#3E8B62" },
  { bg: "#F4DC8E", color: "#9A7B1E" },
  { bg: "#C9B6E8", color: "#7B5FC0" },
  { bg: "#A9C7E8", color: "#fff" },
] as const;

export function nextAvatarColor(index: number) {
  return AVATAR_POOL[index % AVATAR_POOL.length];
}

export function calcularEdad(fecha: string): number {
  const [day, month, year] = fecha.split("/").map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function formatearFecha(fecha: string): string {
  const [day, month, year] = fecha.split("/").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${months[month - 1]} ${year}`;
}

export function parseAllergens(texto: string): string[] {
  if (!texto.trim()) return [];
  return texto
    .split(",")
    .map((a) => a.trim().toUpperCase())
    .filter((a) => a.length > 0);
}

export function fechaHoy(): string {
  const today = new Date();
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${months[today.getMonth()]} ${today.getFullYear()}`;
}

export function mapDbChildToChild(
  row: DbChild,
  roomName: string,
  index: number
): Child {
  const birth = new Date(row.birth_date);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const birthdateLabel = `${birth.getDate()} ${months[birth.getMonth()]} ${birth.getFullYear()}`;

  const enrolled = new Date(row.enrolled_at);
  const admissionLabel = `${months[enrolled.getMonth()]} ${enrolled.getFullYear()}`;

  const avatar = AVATAR_POOL[index % AVATAR_POOL.length];

  return {
    id: row.id,
    name: row.full_name,
    initial: row.full_name[0].toUpperCase(),
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
    ageYears: age,
    birthdateLabel,
    room: roomName,
    admissionLabel,
    allergens: row.allergy_tags.map((t) => t.toUpperCase()),
    allergyNotes: row.medical_notes ?? undefined,
    linkedParents: [],
  };
}
