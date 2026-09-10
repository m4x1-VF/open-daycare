"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signIn } from "@/app/(auth)/login/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, { error: null });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = email.trim() !== "" && password !== "" && !isPending;

  return (
    <div className="w-full max-w-[392px]">
      <h2 className="font-fredoka font-semibold text-[30px] mb-1.5 text-text">
        Iniciar sesión
      </h2>
      <p className="mb-7 text-auth-muted text-[15px]">
        Ingresá para ver el día de hoy.
      </p>

      <form action={formAction}>
        <div className="text-[12px] font-bold tracking-[0.7px] text-auth-muted mb-2">
          EMAIL
        </div>
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full py-3.5 px-4 rounded-[14px] border-[1.5px] border-auth-input-border bg-white text-[15px] text-auth-input-text mb-[18px]"
        />

        <div className="text-[12px] font-bold tracking-[0.7px] text-auth-muted mb-2">
          CONTRASEÑA
        </div>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full py-3.5 px-4 rounded-[14px] border-[1.5px] border-auth-input-border bg-white text-[15px] text-auth-input-text mb-2.5"
        />

        <div className="text-right mb-5">
          <a
            href="#"
            className="text-auth-link text-[13.5px] font-bold"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="block text-center w-full py-[15px] rounded-[15px] bg-gradient-to-b from-auth-btn-start to-auth-btn-end text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Iniciar sesión
        </button>

        {state.error && (
          <p role="alert" className="mt-3 text-center text-[14px] font-bold text-edit">
            {state.error}
          </p>
        )}
      </form>

      <p className="text-center mt-6 text-auth-muted text-[14.5px]">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activar-cuenta"
          className="text-auth-link font-extrabold"
        >
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}
