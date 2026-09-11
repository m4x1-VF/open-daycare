"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServiceClient } from "@/utils/supabase/service";
import { createClient } from "@/utils/supabase/server";

interface InvitationRow {
  id: string;
  email: string;
  full_name: string;
  child_id: string;
  relationship: string;
  status: string;
  expires_at: string;
}

export async function acceptInvitation(
  code: string,
  password: string,
  photoConsent: boolean
): Promise<{ error?: string }> {
  const db = createServiceClient();
  const authClient = createServiceClient();

  const { data: invitation, error: inviteError } = await db
    .from("invitations")
    .select(
      "id, email, full_name, child_id, relationship, status, expires_at, children!inner(room_id)"
    )
    .eq("code", code)
    .single<InvitationRow & { children: { room_id: string } }>();

  if (inviteError || !invitation) {
    return { error: "invalid_or_expired" };
  }

  if (invitation.status !== "pending" || new Date(invitation.expires_at) < new Date()) {
    return { error: "invalid_or_expired" };
  }

  const { data: room, error: roomError } = await db
    .from("rooms")
    .select("daycare_id")
    .eq("id", invitation.children.room_id)
    .single<{ daycare_id: string }>();

  if (roomError || !room) {
    return { error: "unexpected" };
  }

  const { data: signUpData, error: signUpError } = await authClient.auth.signUp({
    email: invitation.email,
    password,
    options: {
      data: {
        full_name: invitation.full_name,
        role: "parent",
        daycare_id: room.daycare_id,
        status: "active",
      },
    },
  });

  if (signUpError) {
    if (signUpError.status === 422 || /already|registered|exists/i.test(signUpError.message)) {
      return { error: "already_registered" };
    }
    return { error: "unexpected" };
  }

  if (!signUpData.user) {
    return { error: "unexpected" };
  }
  const newUserId = signUpData.user.id;

  const { data: accepted, error: acceptError } = await db
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("code", code)
    .select("id")
    .single<{ id: string }>();

  if (acceptError || !accepted) {
    return { error: "unexpected" };
  }

  const { error: linkError } = await db
    .from("parent_children")
    .insert({
      parent_id: newUserId,
      child_id: invitation.child_id,
      relationship: invitation.relationship,
      photo_consent: photoConsent,
    });

  if (linkError) {
    return { error: "unexpected" };
  }

  const cookieClient = createClient(await cookies());
  const { error: signInError } = await cookieClient.auth.signInWithPassword({
    email: invitation.email,
    password,
  });

  if (signInError) {
    return { error: "sign_in_failed" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
