import { LinkedParent } from "@/_lib/child-types";
import { Avatar } from "@/app/_components/ui/avatar";

interface ParentsCardProps {
  parents: LinkedParent[];
}

export default function ParentsCard({ parents }: ParentsCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 px-[18px]">
      <div className="text-[12.5px] font-extrabold tracking-[.8px] text-section-label mb-[14px]">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-[14px]">
        {parents.map((parent) => (
          <div key={parent.id} className="flex items-center gap-3">
            <Avatar
              initial={parent.initial}
              avatarBg={parent.avatarBg}
              avatarColor={parent.avatarColor}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-[14.5px] text-text">
                {parent.name}
              </div>
              <div className="text-[12.5px] text-text-faint">
                {parent.roleLabel} · {parent.statusLabel.toLowerCase()}
              </div>
            </div>
            <span
              className={`flex-none text-[10.5px] font-extrabold py-1 px-[9px] rounded-full ${
                parent.status === "active"
                  ? "bg-status-active-bg text-status-active"
                  : "bg-status-pending-bg text-status-pending"
              }`}
            >
              {parent.statusLabel}
            </span>
          </div>
        ))}
        <a href="#" className="flex items-center gap-3 pt-2">
          <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-[#B0A290] flex-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-extrabold text-[14.5px] text-edit">
            Vincular otro padre
          </span>
        </a>
      </div>
    </div>
  );
}
