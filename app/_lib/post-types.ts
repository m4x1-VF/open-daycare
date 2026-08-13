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
