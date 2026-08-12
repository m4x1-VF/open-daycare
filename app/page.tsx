import Sidebar from "@/app/_components/feed/sidebar";
import TopBar from "@/app/_components/feed/top-bar";
import Composer from "@/app/_components/feed/composer";
import PostCard from "@/app/_components/feed/post-card";
import { mockPosts } from "@/app/_lib/mock-posts";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 min-w-0">
          <div className="max-w-[760px] w-full mx-auto px-10 py-[34px] pb-20 max-md:px-4">
            <div className="mb-6">
              <div className="text-[12.5px] font-extrabold tracking-[.8px] text-nav-active-text mb-1">
                GUARDERÍA · SALA SOLES
              </div>
              <h1 className="font-fredoka font-semibold text-[30px] m-0 text-text">
                Buenas, Caro
              </h1>
              <p className="m-[5px]_0_0 text-text-muted text-[14.5px]">
                12 niños · martes 17 jun
              </p>
            </div>

            <Composer />

            <div className="flex items-center gap-[14px] mb-[14px]">
              <span className="text-[12.5px] font-extrabold tracking-[.8px] text-section-label">
                PUBLICADO HOY
              </span>
              <span className="flex-1 h-px bg-section-line" />
            </div>

            <div className="flex flex-col gap-4">
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
