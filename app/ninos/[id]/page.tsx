import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Sidebar from "@/app/_components/feed/sidebar";
import TopBar from "@/app/_components/feed/top-bar";
import ChildProfileHeader from "@/app/_components/ninos/child-profile-header";
import AllergiesCard from "@/app/_components/ninos/allergies-card";
import ChildDetails from "@/app/_components/ninos/child-details";
import ParentsSection from "@/app/_components/ninos/parents-section";
import { createClient } from "@/utils/supabase/server";
import { DbChild, DbInvitation } from "@/app/_lib/db-types";
import { mapDbChildToChild, nextAvatarColor } from "@/app/_lib/child-helpers";
import { LinkedParent } from "@/app/_lib/child-types";
import { ROLE_LABELS } from "@/app/_lib/invite-helpers";

interface NinosIdPageProps {
  params: Promise<{ id: string }>;
}

interface ParentChildJoinRow {
  id: string;
  relationship: "mom" | "dad" | "guardian";
  users: { full_name: string; avatar_url: string | null } | null;
}

interface ChildDetailRow extends DbChild {
  rooms: { name: string };
  parent_children: ParentChildJoinRow[];
}

export default async function NinosIdPage({ params }: NinosIdPageProps) {
  const { id } = await params;

  const supabase = await createClient(await cookies());

  const { data: childRow, error } = await supabase
    .from("children")
    .select(
      "*, rooms(id, name), parent_children(id, relationship, users(full_name, avatar_url))"
    )
    .eq("id", id)
    .single();

  if (error || !childRow) {
    notFound();
  }

  const childDetail = childRow as unknown as ChildDetailRow;

  const child = mapDbChildToChild(childDetail, childDetail.rooms.name, 0);

  child.linkedParents = childDetail.parent_children.map(
    (link, index): LinkedParent => {
      const parentName = link.users?.full_name ?? "";
      const avatar = nextAvatarColor(index);
      return {
        id: link.id,
        name: parentName,
        email: "",
        initial: parentName[0]?.toUpperCase() ?? "?",
        avatarBg: avatar.bg,
        avatarColor: avatar.color,
        role: link.relationship,
        roleLabel: ROLE_LABELS[link.relationship],
        status: "active",
        statusLabel: "ACTIVO",
      };
    }
  );

  const { data: pendingInvitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("child_id", child.id)
    .eq("status", "pending");

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden md:block">
        <Sidebar activeItem="ninos" />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <div className="max-w-[820px] w-full mx-auto px-10 py-[34px] pb-20 max-md:px-4">
            <Link
              href="/ninos"
              className="flex items-center gap-[7px] text-text-muted font-bold text-[14px] mb-5"
            >
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
                <path d="m15 18-6-6 6-6" />
              </svg>
              Volver a Niños
            </Link>

            <div className="flex gap-[26px] items-start flex-wrap">
              <div className="flex-1 min-w-[300px] flex flex-col gap-[18px]">
                <ChildProfileHeader
                  initial={child.initial}
                  avatarBg={child.avatarBg}
                  avatarColor={child.avatarColor}
                  name={child.name}
                  ageYears={child.ageYears}
                  room={child.room}
                />

                {child.allergyNotes && (
                  <AllergiesCard notes={child.allergyNotes} />
                )}

                <ChildDetails child={child} />
              </div>

              <div className="w-[300px] flex-none flex flex-col gap-[14px] max-md:w-full">
                <a
                  href="#"
                  className="flex items-center justify-center gap-[9px] w-full py-[13px] rounded-[14px] bg-text text-white font-extrabold text-[15px]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                  </svg>
                  Resumen del día
                </a>

                <ParentsSection
                  child={child}
                  childId={child.id}
                  initialPendingInvitations={(pendingInvitations ?? []) as DbInvitation[]}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
