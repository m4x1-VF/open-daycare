export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "encouragement"
  | "photo"
  | "announcement";

export interface FeedPost {
  id: string;
  authorName: string;
  authorInitial: string;
  authorAvatarBg: string;
  authorAvatarColor: string;
  timeLabel: string;
  postedByLabel: string;
  recipientLabel: string;
  type: PostType;
  text: string;
  photoLabel?: string;
  hearts: number;
  comments: number;
}

export const POST_TYPE_LABELS: Record<PostType, string> = {
  meal: "Comida",
  nap: "Siesta",
  activity: "Actividad",
  achievement: "Logro",
  encouragement: "Ánimo",
  photo: "Foto",
  announcement: "Anuncio",
};

export const POST_TYPE_COLORS: Record<PostType, { bg: string; text: string }> =
  {
    meal: { bg: "#9A7B1E", text: "#FFFFFF" },
    nap: { bg: "#E7DCF6", text: "#7B5FC0" },
    activity: { bg: "#2E89A6", text: "#FFFFFF" },
    achievement: { bg: "#CFEBD8", text: "#3E9B6C" },
    encouragement: { bg: "#F9D2DE", text: "#C56486" },
    photo: { bg: "#FBD8CC", text: "#D9684A" },
    announcement: { bg: "#CCD8F4", text: "#4E72C8" },
  };

export type Recipient =
  | { kind: "children"; childIds: string[] }
  | { kind: "room"; label: string };
