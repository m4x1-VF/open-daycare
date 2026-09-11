import Link from "next/link";
import { cookies } from "next/headers";

import { ActivateAccountForm } from "@/app/_components/auth/activate-account-form";
import type { InvitationPreview } from "@/app/_lib/invite-helpers";
import { createClient } from "@/utils/supabase/server";

export default async function ActivateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (!code) {
    return <InvalidInvitation />;
  }

  const preview = await getInvitationPreview(code);

  if (!preview) {
    return <InvalidInvitation />;
  }

  if (preview.status !== "pending") {
    return <InvitationNotPending preview={preview} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-bg py-10 px-10">
      <ActivateAccountForm preview={preview} />
    </div>
  );
}

async function getInvitationPreview(code: string): Promise<InvitationPreview | null> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("get_invitation_preview", {
    p_code: code,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

function InvalidInvitation() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-bg py-10 px-10">
      <div className="w-full max-w-[440px]">
        <h1 className="font-fredoka font-semibold text-[32px] leading-[1.15] mb-2 text-text">
          Invitación no válida
        </h1>
        <p className="mb-[26px] text-auth-muted text-[15.5px] leading-[1.55]">
          El código de invitación no existe o no es válido. Verificá el link del
          email de invitación.
        </p>
        <Link
          href="/login"
          className="block text-center w-full py-[15px] rounded-[15px] bg-gradient-to-b from-auth-btn-start to-auth-btn-end text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

function InvitationNotPending({ preview }: { preview: InvitationPreview }) {
  const MESSAGES: Record<
    Exclude<InvitationPreview["status"], "pending">,
    { title: string; description: string }
  > = {
    accepted: {
      title: "Invitación ya aceptada",
      description:
        "Esta invitación ya fue utilizada para activar una cuenta. Iniciá sesión con tu email y contraseña.",
    },
    cancelled: {
      title: "Invitación cancelada",
      description:
        "Esta invitación fue cancelada por la guardería. Si pensás que es un error, contactá a la institución.",
    },
    expired: {
      title: "Código expirado",
      description:
        "El código de invitación ya expiró. Para activar tu cuenta, pedile a la guardería una nueva invitación.",
    },
  };

  const { title, description } = MESSAGES[preview.status as Exclude<InvitationPreview["status"], "pending">];

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-bg py-10 px-10">
      <div className="w-full max-w-[440px]">
        <h1 className="font-fredoka font-semibold text-[32px] leading-[1.15] mb-2 text-text">
          {title}
        </h1>
        <p className="mb-[26px] text-auth-muted text-[15.5px] leading-[1.55]">
          {description}
        </p>
        <Link
          href="/login"
          className="block text-center w-full py-[15px] rounded-[15px] bg-gradient-to-b from-auth-btn-start to-auth-btn-end text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
