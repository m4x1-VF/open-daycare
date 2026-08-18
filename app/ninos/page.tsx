import Sidebar from "@/app/_components/feed/sidebar";
import TopBar from "@/app/_components/feed/top-bar";
import KidCard from "@/app/_components/ninos/kid-card";
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
            <div className="flex items-end justify-between gap-4 mb-[22px]">
              <div>
                <div className="text-[12.5px] font-extrabold tracking-[.8px] text-nav-active-text mb-1">
                  GESTIÓN
                </div>
                <h1 className="font-fredoka font-semibold text-[30px] m-0 text-text">
                  Niños
                </h1>
              </div>
              <a
                href="#"
                className="flex items-center gap-2 py-3 px-[18px] rounded-[14px] bg-gradient-to-b from-coral-light to-coral-dark text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Agregar niño
              </a>
            </div>

            <div className="flex items-center gap-[11px] bg-card border border-border rounded-[14px] p-3 px-4 mb-[22px]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B0A290"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                placeholder="Buscar niño…"
                className="flex-1 border-none bg-none text-[15px] text-text placeholder:text-[#B6A99B] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 mb-[14px]">
              <span className="text-[12.5px] font-extrabold tracking-[.8px] text-text">
                SALA SOLES
              </span>
              <span className="text-[13px] text-text-faint">
                {mockChildren.length} niños
              </span>
              <span className="flex-1 h-px bg-section-line" />
            </div>

            <div className="grid grid-cols-2 gap-[14px]">
              {mockChildren.map((child) => (
                <KidCard key={child.id} child={child} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
