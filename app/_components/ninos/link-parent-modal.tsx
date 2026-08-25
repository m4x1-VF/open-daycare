"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LinkedParent } from "@/app/_lib/child-types";
import { ROLES, ROLE_LABELS, generateInviteCode } from "@/app/_lib/invite-helpers";
import { AVATAR_POOL } from "@/app/_lib/child-helpers";

interface LinkParentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (parent: LinkedParent) => void;
  childName: string;
  existingEmails: string[];
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.includes("@")) return false;
  const domain = trimmed.split("@")[1];
  return !!domain && domain.includes(".");
}

export default function LinkParentModal({
  open,
  onClose,
  onSave,
  childName,
  existingEmails,
}: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedRole, setTouchedRole] = useState(false);

  const [dataState, setDataState] = useState<"open" | "closing">();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const shouldRender = open || dataState === "closing";

  useEffect(() => {
    if (!shouldRender) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldRender]);

  const nameError =
    touchedName && !name.trim() ? "El nombre es obligatorio" : "";

  const emailError = touchedEmail
    ? !email.trim()
      ? "El email es obligatorio"
      : !isValidEmail(email)
        ? "Formato de email inválido"
        : existingEmails.includes(email.trim().toLowerCase())
          ? "Ya existe un padre vinculado con ese email"
          : ""
    : "";

  const roleError = touchedRole && !role ? "Seleccioná un parentesco" : "";

  const isFormValid =
    name.trim().length > 0 &&
    isValidEmail(email) &&
    !!role &&
    !existingEmails.includes(email.trim().toLowerCase());

  function resetForm() {
    setName("");
    setEmail("");
    setRole("");
    setInviteCode("");
    setTouchedName(false);
    setTouchedEmail(false);
    setTouchedRole(false);
  }

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      const code = generateInviteCode();
      requestAnimationFrame(() => {
        setInviteCode(code);
        requestAnimationFrame(() => {
          setDataState("open");
        });
      });
      const focusTimer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
    } else if (dataState === "open") {
      queueMicrotask(() => setDataState("closing"));
    }
  }, [open, dataState]);

  useEffect(() => {
    if (dataState === "closing") {
      const timer = setTimeout(() => {
        setDataState(undefined);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [dataState]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && dataState === "open") {
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dataState, handleClose]);

  function handleSave() {
    setTouchedName(true);
    setTouchedEmail(true);
    setTouchedRole(true);

    if (!isFormValid) return;

    const trimmedName = name.trim();
    const poolIndex = existingEmails.length % AVATAR_POOL.length;

    const newParent: LinkedParent = {
      id: crypto.randomUUID(),
      name: trimmedName,
      email: email.trim().toLowerCase(),
      initial: trimmedName[0].toUpperCase(),
      avatarBg: AVATAR_POOL[poolIndex].bg,
      avatarColor: AVATAR_POOL[poolIndex].color,
      role: role as "mom" | "dad" | "guardian",
      roleLabel: ROLE_LABELS[role],
      status: "pending",
      statusLabel: "PENDIENTE",
    };

    onSave(newParent);
    resetForm();
  }

  if (!shouldRender) return null;

  const inputBase =
    "modal-input w-full py-[13px] px-4 rounded-[14px] border-[1.5px] bg-white text-[15px] text-text placeholder:text-[#B6A99B] transition-colors duration-200 focus:outline-none focus:border-coral-dark focus:ring-2 focus:ring-coral-light/20 focus:ring-offset-0";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-6">
      <div
        className="modal-overlay absolute inset-0 bg-black/40"
        data-state={dataState}
        onClick={handleClose}
      />
      <div
        className="modal-card relative w-full max-w-[480px] bg-[#FBF4EC] border border-border rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
        data-state={dataState}
      >
        <div className="flex items-center justify-between px-[26px] py-5 border-b border-border">
          <div>
            <div className="font-fredoka font-semibold text-[18px] text-text">
              Vincular padre
            </div>
            <div className="text-[13px] text-[#A89A8B]">a {childName}</div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-[34px] h-[34px] rounded-[10px] bg-[#F0E6D8] text-[#94887B] flex items-center justify-center hover:bg-[#E7DAC8] transition-colors active:scale-[0.97] transition-transform duration-150"
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
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-[26px] py-[22px]">
          <div className="flex gap-[11px] bg-[#E3ECFB] rounded-[14px] p-[13px] pr-4 mb-5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4E72C8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-none mt-[1px]"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span className="text-[13.5px] text-[#3F5694] leading-[1.45]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {childName}.
            </span>
          </div>

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2">
            NOMBRE DEL PADRE/MADRE
          </div>
          <input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouchedName(true)}
            placeholder="Ej. Diego Fernández"
            className={`${inputBase} mb-1 ${
              nameError ? "border-red-400" : "border-[#EADFD0]"
            }`}
          />
          {nameError && (
            <div className="text-[12px] text-red-500 mb-[18px]">
              {nameError}
            </div>
          )}
          {!nameError && <div className="mb-[18px]" />}

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2">
            EMAIL
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouchedEmail(true)}
            placeholder="correo@ejemplo.com"
            className={`${inputBase} mb-1 ${
              emailError ? "border-red-400" : "border-[#EADFD0]"
            }`}
          />
          {emailError && (
            <div className="text-[12px] text-red-500 mb-[18px]">
              {emailError}
            </div>
          )}
          {!emailError && <div className="mb-[18px]" />}

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-[10px]">
            PARENTESCO
          </div>
          <div className="flex gap-[9px] mb-5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  setRole(r.value);
                  setTouchedRole(true);
                }}
                className={`flex-1 py-[11px] rounded-full border-[1.5px] font-extrabold text-[14px] cursor-pointer transition-colors duration-200 ${
                  role === r.value
                    ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                    : "border-border bg-[#FFFDF9] text-[#6E6359]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {roleError && (
            <div className="text-[12px] text-red-500 -mt-3 mb-4">
              {roleError}
            </div>
          )}

          <div className="bg-[#FBF1D6] border-[1.5px] border-dashed border-invite-border rounded-[16px] p-[18px] text-center mb-5">
            <div className="text-[12px] font-extrabold tracking-[.7px] text-invite-label mb-2">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-fredoka font-semibold text-[34px] tracking-[7px] text-[#8A7234]">
              {inviteCode}
            </div>
            <div className="text-[13px] text-invite-label mt-[6px]">
              Vence en 7 días
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid}
            className="flex items-center justify-center gap-[9px] w-full py-[14px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[15.5px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-transform duration-150"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
            Enviar invitación
          </button>
        </div>
      </div>
    </div>
  );
}
