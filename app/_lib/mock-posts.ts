export type PostType = "achievement" | "activity" | "announcement";

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
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};

export const mockPosts: FeedPost[] = [
  {
    id: "post-1",
    authorName: "Mateo",
    authorInitial: "M",
    authorAvatarBg: "#A9D9E8",
    authorAvatarColor: "#1F7A93",
    timeLabel: "14:20",
    postedByLabel: "publicado por vos",
    recipientLabel: "familia de Mateo",
    type: "achievement",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    hearts: 3,
    comments: 1,
  },
  {
    id: "post-2",
    authorName: "Mateo",
    authorInitial: "M",
    authorAvatarBg: "#A9D9E8",
    authorAvatarColor: "#1F7A93",
    timeLabel: "09:40",
    postedByLabel: "publicado por vos",
    recipientLabel: "familia de Mateo",
    type: "activity",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoLabel: "Foto · pintando con témperas",
    hearts: 5,
    comments: 2,
  },
  {
    id: "post-3",
    authorName: "Anuncio general",
    authorInitial: "",
    authorAvatarBg: "#CCD8F4",
    authorAvatarColor: "#4E72C8",
    timeLabel: "07:50",
    postedByLabel: "publicado por vos",
    recipientLabel: "toda la sala",
    type: "announcement",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    hearts: 8,
    comments: 0,
  },
];
