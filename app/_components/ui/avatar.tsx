interface AvatarProps {
  initial: string;
  avatarBg: string;
  avatarColor: string;
  size: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { box: 40, font: 16 },
  md: { box: 48, font: 19 },
  lg: { box: 84, font: 34 },
};

export function Avatar({ initial, avatarBg, avatarColor, size }: AvatarProps) {
  const { box, font } = sizeMap[size];
  return (
    <div
      className="flex-none rounded-full flex items-center justify-center font-fredoka font-semibold"
      style={{
        width: box,
        height: box,
        backgroundColor: avatarBg,
        color: avatarColor,
        fontSize: font,
      }}
    >
      {initial}
    </div>
  );
}
