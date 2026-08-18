import Link from "next/link";
import { Child } from "@/app/_lib/child-types";
import { Avatar } from "@/app/_components/ui/avatar";

interface KidCardProps {
  child: Child;
}

export default function KidCard({ child }: KidCardProps) {
  const parentCount = child.linkedParents.length;
  const parentLabel =
    parentCount === 0
      ? "sin padres vinculados"
      : `${parentCount} padre${parentCount !== 1 ? "s" : ""} vinculado${parentCount !== 1 ? "s" : ""}`;

  let rightSlot: React.ReactNode;
  if (child.allergens.length > 0) {
    rightSlot = (
      <span className="flex-none text-[11px] font-extrabold py-[5px] px-[9px] rounded-full bg-allergy-badge-bg text-allergy-badge">
        {child.allergens[0]}
      </span>
    );
  } else if (child.linkedParents.length === 0) {
    rightSlot = (
      <span className="flex-none text-[11px] font-extrabold py-[5px] px-[9px] rounded-full bg-link-badge-bg text-link-badge">
        VINCULAR
      </span>
    );
  } else {
    rightSlot = (
      <svg
        className="flex-none"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#CBB89F"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  return (
    <Link
      href={`/ninos/${child.id}`}
      className="flex items-center gap-[14px] min-w-0 bg-card border border-border rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] hover:border-[#F2A78E] hover:-translate-y-0.5 transition-all"
    >
      <Avatar
        initial={child.initial}
        avatarBg={child.avatarBg}
        avatarColor={child.avatarColor}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="font-fredoka font-semibold text-[16px] text-text">
          {child.name}
        </div>
        <div className="text-[13px] text-text-faint">
          {child.ageYears} años · {parentLabel}
        </div>
      </div>
      {rightSlot}
    </Link>
  );
}
