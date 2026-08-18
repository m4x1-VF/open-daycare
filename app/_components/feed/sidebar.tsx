import { NavItem } from "@/_lib/child-types";

interface SidebarProps {
  activeItem?: NavItem;
}

export default function Sidebar({ activeItem = "feed" }: SidebarProps) {
  const navItems: { key: NavItem; label: string; href: string; icon: React.ReactNode }[] = [
    {
      key: "feed",
      label: "Feed",
      href: "/",
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      ),
    },
    {
      key: "ninos",
      label: "Niños",
      href: "/ninos",
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
        </svg>
      ),
    },
    {
      key: "avisos",
      label: "Avisos",
      href: "#",
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      ),
    },
    {
      key: "cuenta",
      label: "Mi cuenta",
      href: "#",
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-[248px] flex-none bg-card border-r border-border flex flex-col p-6 px-4 sticky top-0 h-screen">
      <a
        href="#"
        className="flex items-center gap-[11px] px-2 pb-[22px]"
      >
        <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[#F8C3A8] to-coral flex items-center justify-center flex-none">
          <svg
            width="21"
            height="21"
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
        <div>
          <div className="font-fredoka font-semibold text-[17px] text-text leading-none">
            OpenDayCare
          </div>
          <div className="text-[11.5px] text-text-faint mt-0.5">
            Sala Soles
          </div>
        </div>
      </a>

      <a
        href="#"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] bg-gradient-to-b from-coral-light to-coral-dark text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] mb-[18px]"
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
        Nueva publicación
      </a>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = activeItem === item.key;
          return (
            <a
              key={item.key}
              href={item.href}
              className={
                isActive
                  ? "flex items-center gap-3 py-[11px] px-3 rounded-xl bg-nav-active-bg text-nav-active-text font-extrabold text-[14.5px]"
                  : "flex items-center gap-3 py-[11px] px-3 rounded-xl text-nav-inactive font-semibold text-[14.5px]"
              }
            >
              {item.icon}
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-border pt-[14px] mt-2.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="w-[38px] h-[38px] rounded-full bg-coral text-white font-fredoka font-semibold text-base flex items-center justify-center flex-none">
            C
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm text-text">
              Caro Giménez
            </div>
            <div className="text-xs text-text-faint">Maestra · Soles</div>
          </div>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex-none w-8 h-8 rounded-[10px] bg-cream text-text-muted flex items-center justify-center"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}
