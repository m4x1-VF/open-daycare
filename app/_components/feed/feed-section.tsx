"use client";

import { useState, useEffect } from "react";
import Composer from "@/app/_components/feed/composer";
import CreatePostModal from "@/app/_components/feed/create-post-modal";
import { OPEN_CREATE_POST_EVENT } from "@/app/_components/feed/new-post-button";
import PostCard from "@/app/_components/feed/post-card";
import { Child } from "@/app/_lib/child-types";
import { FeedPost } from "@/app/_lib/post-types";

interface FeedSectionProps {
  initialPosts: FeedPost[];
  childList: Child[];
}

export default function FeedSection({
  initialPosts,
  childList,
}: FeedSectionProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    function handleOpenEvent() {
      setIsModalOpen(true);
    }
    window.addEventListener(OPEN_CREATE_POST_EVENT, handleOpenEvent);
    return () =>
      window.removeEventListener(OPEN_CREATE_POST_EVENT, handleOpenEvent);
  }, []);

  function handlePublish(post: FeedPost) {
    setPosts((prev) => [post, ...prev]);
  }

  return (
    <>
      <Composer onClick={() => setIsModalOpen(true)} />

      <div className="flex items-center gap-[14px] mb-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-section-label">
          PUBLICADO HOY
        </span>
        <span className="flex-1 h-px bg-section-line" />
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <CreatePostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPublish={handlePublish}
        childList={childList}
      />
    </>
  );
}
