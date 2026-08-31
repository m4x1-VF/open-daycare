import Sidebar from "@/app/_components/feed/sidebar";
import TopBar from "@/app/_components/feed/top-bar";
import FeedSection from "@/app/_components/feed/feed-section";
import { mockPosts } from "@/app/_lib/mock-posts";
import { mockChildren } from "@/app/_lib/mock-children";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden md:block">
        <Sidebar activeItem="feed" />
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

            <FeedSection initialPosts={mockPosts} childList={mockChildren} />
          </div>
        </main>
      </div>
    </div>
  );
}
