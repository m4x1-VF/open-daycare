import { SignOutButton } from "@/app/_components/auth/sign-out-button";

export default function TopBar() {
  return (
    <div className="flex md:hidden items-center gap-3 bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F8C3A8] to-coral flex items-center justify-center flex-none">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
        <span className="font-fredoka font-semibold text-[15px] text-text">
          OpenDayCare
        </span>
      </div>

      <span className="flex-1" />

      <a
        href="#"
        className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-b from-coral-light to-coral-dark text-white font-extrabold text-xs"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </a>

      <SignOutButton className="flex-none w-9 h-9 rounded-xl bg-cream text-text-muted" />

      <div className="w-9 h-9 rounded-full bg-coral text-white font-fredoka font-semibold text-sm flex items-center justify-center flex-none">
        C
      </div>
    </div>
  );
}
