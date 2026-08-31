import type { FeedPost, PostType } from "@/app/_lib/post-types";
import { POST_TYPE_LABELS } from "@/app/_lib/post-types";

const TAG_STYLES: Record<PostType, string> = {
  meal: "bg-tag-meal-bg text-tag-meal",
  nap: "bg-tag-nap-bg text-tag-nap",
  achievement: "bg-tag-achievement-bg text-tag-achievement",
  activity: "bg-tag-activity-bg text-tag-activity",
  encouragement: "bg-tag-encouragement-bg text-tag-encouragement",
  photo: "bg-tag-photo-bg text-tag-photo",
  announcement: "bg-tag-announcement-bg text-tag-announcement",
};

export default function PostCard({ post }: { post: FeedPost }) {
  const tagLabel = POST_TYPE_LABELS[post.type];
  const tagClass = TAG_STYLES[post.type];

  return (
    <div className="bg-card border border-border rounded-[20px] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="flex items-center gap-3 mb-[14px]">
        {post.authorInitial ? (
          <div
            className="w-11 h-11 rounded-full font-fredoka font-semibold text-[17px] flex items-center justify-center flex-none"
            style={{
              backgroundColor: post.authorAvatarBg,
              color: post.authorAvatarColor,
            }}
          >
            {post.authorInitial}
          </div>
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-none"
            style={{ backgroundColor: post.authorAvatarBg }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={post.authorAvatarColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </div>
        )}

        <div className="flex-1">
          <div className="font-fredoka font-semibold text-[16.5px] text-text">
            {post.authorName}
          </div>
          <div className="text-[12.5px] text-text-faint">
            {post.timeLabel} · {post.postedByLabel}
          </div>
        </div>

        <div
          className={`flex items-center gap-[7px] py-1.5 px-3 rounded-full ${tagClass}`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          <span className="text-xs font-extrabold tracking-wide uppercase">
            {tagLabel}
          </span>
        </div>
      </div>

      <div className="text-[12.5px] text-text-faint mb-2.5">
        Para: {post.recipientLabel}
      </div>

      <p className="text-[15.5px] leading-[1.55] text-text-body m-0">
        {post.text}
      </p>

      {post.photoLabel && (
        <a
          href="#"
          className="flex flex-col items-center justify-center gap-2 mt-[14px] border-[1.5px] border-dashed border-photo-placeholder-border rounded-2xl bg-photo-placeholder-bg h-[200px] text-photo-placeholder-text"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-[13.5px]">{post.photoLabel}</span>
        </a>
      )}

      <div className="flex items-center gap-[18px] mt-4 pt-[14px] border-t border-border-soft">
        <span className="flex items-center gap-[7px] text-heart font-bold text-sm">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="#E0654A"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {post.hearts}
        </span>
        <a
          href="#"
          className="flex items-center gap-[7px] text-text-muted font-bold text-sm"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
          </svg>
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-edit font-extrabold text-sm">
          Editar
        </a>
      </div>
    </div>
  );
}
