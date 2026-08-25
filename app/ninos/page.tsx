import Sidebar from "@/app/_components/feed/sidebar";
import TopBar from "@/app/_components/feed/top-bar";
import NinosManager from "@/app/_components/ninos/ninos-manager";
import { mockChildren } from "@/app/_lib/mock-children";

export default function NinosPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden md:block">
        <Sidebar activeItem="ninos" />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <div className="max-w-[880px] w-full mx-auto px-10 py-[34px] pb-20 max-md:px-4">
            <NinosManager initialChildren={mockChildren} />
          </div>
        </main>
      </div>
    </div>
  );
}
