"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { generateInviteCode, ROLE_LABELS } from "@/app/_lib/invite-helpers";

interface AddChildInput {
  full_name: string;
  birth_date: string;
  room_id: string;
  allergy_tags: string[];
  medical_notes?: string;
}

export async function addChild(input: AddChildInput) {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from("children")
    .insert({
      full_name: input.full_name,
      birth_date: input.birth_date,
      room_id: input.room_id,
      allergy_tags: input.allergy_tags,
      medical_notes: input.medical_notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

interface SendInvitationInput {
  child_id: string;
  child_name: string;
  full_name: string;
  email: string;
  relationship: "mom" | "dad" | "guardian";
}

export async function sendInvitation(input: SendInvitationInput) {
  const supabase = await createClient(await cookies());

  const { data: claimsData } = await supabase.auth.getClaims();
  const invitedBy = claimsData?.claims.sub;
  if (!invitedBy) throw new Error("Not authenticated");

  const code = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      child_id: input.child_id,
      invited_by: invitedBy,
      full_name: input.full_name,
      email: input.email.trim().toLowerCase(),
      relationship: input.relationship,
      code,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const roleLabel = ROLE_LABELS[input.relationship];

  try {
    await resend.emails.send({
      from: "OpenDayCare <onboarding@resend.dev>",
      to: input.email,
      subject: "Activá tu cuenta en OpenDayCare",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
          <h2>¡Hola ${input.full_name}!</h2>
          <p>Fuiste vinculado como <strong>${roleLabel}</strong> de <strong>${input.child_name}</strong>.</p>
          <p>Tu código de invitación es:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;background:#FBF1D6;padding:20px;border-radius:12px;margin:16px 0">
            ${code}
          </div>
          <p style="text-align:center">
            <a href="${appUrl}/activar-cuenta?code=${code}"
               style="display:inline-block;background:#EE8164;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold">
              Activar mi cuenta
            </a>
          </p>
          <p style="font-size:13px;color:#888">Este código vence en 7 días.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
    throw new Error(
      `La invitación quedó registrada pero no pudimos enviar el email a ${input.email}.`
    );
  }

  return data;
}
