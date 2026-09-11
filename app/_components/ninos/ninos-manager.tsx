"use client";

import { useState } from "react";
import { Child } from "@/app/_lib/child-types";
import { mapDbChildToChild } from "@/app/_lib/child-helpers";
import { addChild } from "@/app/ninos/actions";
import KidCard from "@/app/_components/ninos/kid-card";
import AddChildModal from "@/app/_components/ninos/add-child-modal";

interface AddChildInput {
  full_name: string;
  birth_date: string;
  room_id: string;
  allergy_tags: string[];
  medical_notes?: string;
}

interface NinosManagerProps {
  initialChildren: Child[];
  rooms: { id: string; name: string }[];
}

export default function NinosManager({
  initialChildren,
  rooms,
}: NinosManagerProps) {
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  async function handleSaveChild(data: AddChildInput) {
    try {
      const dbChild = await addChild(data);
      const room = rooms.find((r) => r.id === dbChild.room_id);
      const roomName = room?.name ?? "";
      const uiChild = mapDbChildToChild(dbChild, roomName, children.length);
      setChildren((prev) => [...prev, uiChild]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to add child:", error);
    }
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

      {rooms
        .map((room) => ({
          room,
          kids: children.filter((c) => c.room === room.name),
        }))
        .filter(({ kids }) => kids.length > 0)
        .map(({ room, kids }) => (
          <div key={room.id} className="mb-[22px]">
            <div className="flex items-center gap-3 mb-[14px]">
              <span className="text-[12.5px] font-extrabold tracking-[.8px] text-text">
                SALA {room.name.toUpperCase()}
              </span>
              <span className="text-[13px] text-text-faint">
                {kids.length} {kids.length === 1 ? "niño" : "niños"}
              </span>
              <span className="flex-1 h-px bg-section-line" />
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              {kids.map((child) => (
                <KidCard key={child.id} child={child} />
              ))}
            </div>
          </div>
        ))}

      <AddChildModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChild}
        rooms={rooms}
      />
    </>
  );
}
