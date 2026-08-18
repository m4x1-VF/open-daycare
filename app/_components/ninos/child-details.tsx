import { Child } from "@/_lib/child-types";

interface ChildDetailsProps {
  child: Child;
}

export default function ChildDetails({ child }: ChildDetailsProps) {
  const rows = [
    { label: "Fecha de nacimiento", value: child.birthdateLabel },
    { label: "Sala", value: child.room },
    { label: "Ingreso", value: child.admissionLabel },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex justify-between py-[15px] px-[18px] ${
            i < rows.length - 1 ? "border-b border-border-soft" : ""
          }`}
        >
          <span className="text-text-muted text-[14.5px]">{row.label}</span>
          <span className="font-extrabold text-text text-[14.5px]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
