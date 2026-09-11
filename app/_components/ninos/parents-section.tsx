"use client";

import { useState, useCallback } from "react";
import { Child, LinkedParent } from "@/app/_lib/child-types";
import { DbInvitation } from "@/app/_lib/db-types";
import { nextAvatarColor } from "@/app/_lib/child-helpers";
import { ROLE_LABELS } from "@/app/_lib/invite-helpers";
import { createClient } from "@/utils/supabase/client";
import { sendInvitation } from "@/app/ninos/actions";
import ParentsCard from "./parents-card";
import LinkParentModal from "./link-parent-modal";

interface ParentsSectionProps {
  child: Child;
  childId: string;
  initialPendingInvitations: DbInvitation[];
}

function mapInvitationToParent(
  invitation: DbInvitation,
  index: number
): LinkedParent {
  const avatar = nextAvatarColor(index);
  return {
    id: invitation.id,
    name: invitation.full_name,
    email: invitation.email,
    initial: invitation.full_name[0].toUpperCase(),
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
    role: invitation.relationship,
    roleLabel: ROLE_LABELS[invitation.relationship],
    status: "pending",
    statusLabel: "PENDIENTE",
  };
}

export default function ParentsSection({
  child,
  childId,
  initialPendingInvitations,
}: ParentsSectionProps) {
  const [parents, setParents] = useState<LinkedParent[]>([
    ...child.linkedParents,
    ...initialPendingInvitations.map((invitation, index) =>
      mapInvitationToParent(invitation, index)
    ),
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPendingInvitations = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("child_id", childId)
      .eq("status", "pending");

    if (error) {
      console.error("Failed to load pending invitations:", error);
      return;
    }

    setParents((prev) => {
      const active = prev.filter((p) => p.status === "active");
      const pending = (data as DbInvitation[]).map((invitation, index) =>
        mapInvitationToParent(invitation, index)
      );
      return [...active, ...pending];
    });
  }, [childId]);

  const existingEmails = parents.map((p) => p.email.toLowerCase());

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  async function handleSaveParent(data: {
    child_id: string;
    full_name: string;
    email: string;
    relationship: "mom" | "dad" | "guardian";
  }) {
    await sendInvitation({ ...data, child_name: child.name });
    await fetchPendingInvitations();
  }

  return (
    <>
      <ParentsCard parents={parents} onLinkParent={handleOpenModal} />
      <LinkParentModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveParent}
        childId={childId}
        childName={child.name}
        existingEmails={existingEmails}
      />
    </>
  );
}
