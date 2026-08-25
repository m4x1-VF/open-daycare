"use client";

import { useState } from "react";
import { Child } from "@/app/_lib/child-types";
import { nextAvatarColor } from "@/app/_lib/child-helpers";
import KidCard from "@/app/_components/ninos/kid-card";
import AddChildModal from "@/app/_components/ninos/add-child-modal";

interface NinosManagerProps {
  initialChildren: Child[];
}

export default function NinosManager({ initialChildren }: NinosManagerProps) {
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  function handleSaveChild(child: Child) {
    const colorIndex = children.length;
    const avatar = nextAvatarColor(colorIndex);

    const newChild: Child = {
      ...child,
      avatarBg: avatar.bg,
      avatarColor: avatar.color,
    };

    setChildren([...children, newChild]);
    setIsModalOpen(false);
  }

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-[22px]">
        <div>
          <div className="text-[12.5px] font-extrabold tracking-[.8px] text-nav-active-text mb-1">
            GESTIÓN
          </div>
          <h1 className="font-fredoka font-semibold text-[30px] m-0 text-text">
            Niños
          </h1>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
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
        </button>
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
          {children.length} niños
        </span>
        <span className="flex-1 h-px bg-section-line" />
      </div>

      <div className="grid grid-cols-2 gap-[14px]">
        {children.map((child) => (
          <KidCard key={child.id} child={child} />
        ))}
      </div>

      <AddChildModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChild}
      />
    </>
  );
}
