import { Avatar } from "@/app/_components/ui/avatar";

interface ChildProfileHeaderProps {
  initial: string;
  avatarBg: string;
  avatarColor: string;
  name: string;
  ageYears: number;
  room: string;
}

export default function ChildProfileHeader({
  initial,
  avatarBg,
  avatarColor,
  name,
  ageYears,
  room,
}: ChildProfileHeaderProps) {
  return (
    <div className="flex items-center gap-[18px]">
      <Avatar
        initial={initial}
        avatarBg={avatarBg}
        avatarColor={avatarColor}
        size="lg"
      />
      <div className="flex-1">
        <h1 className="font-fredoka font-semibold text-[28px] m-0 text-text">
          {name}
        </h1>
        <p className="m-[3px]_0_0 text-text-muted text-[15px]">
          {ageYears} años · Sala {room}
        </p>
      </div>
      <a
        href="#"
        className="border-[1.5px] border-border bg-card text-nav-inactive font-bold text-[14px] py-[9px] px-4 rounded-xl"
      >
        Editar
      </a>
    </div>
  );
}
