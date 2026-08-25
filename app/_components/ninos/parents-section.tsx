"use client";

import { useState } from "react";
import { Child, LinkedParent } from "@/app/_lib/child-types";
import { nextAvatarColor } from "@/app/_lib/child-helpers";
import ParentsCard from "./parents-card";
import LinkParentModal from "./link-parent-modal";

interface ParentsSectionProps {
  child: Child;
}

export default function ParentsSection({ child }: ParentsSectionProps) {
  const [parents, setParents] = useState<LinkedParent[]>(child.linkedParents);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const existingEmails = parents.map((p) => p.email.toLowerCase());

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  function handleSaveParent(parent: LinkedParent) {
    const avatarColor = nextAvatarColor(parents.length);
    const newParent = {
      ...parent,
      avatarBg: avatarColor.bg,
      avatarColor: avatarColor.color,
    };
    setParents([...parents, newParent]);
    setIsModalOpen(false);
  }

  return (
    <>
      <ParentsCard parents={parents} onLinkParent={handleOpenModal} />
      <LinkParentModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveParent}
        childName={child.name}
        existingEmails={existingEmails}
      />
    </>
  );
}
