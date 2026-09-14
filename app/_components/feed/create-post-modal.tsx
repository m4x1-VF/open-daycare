"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Child } from "@/app/_lib/child-types";
import {
  FeedPost,
  PostType,
  Recipient,
  POST_TYPE_LABELS,
  POST_TYPE_COLORS,
} from "@/app/_lib/post-types";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: (post: FeedPost) => void;
  childList: Child[];
}

export default function CreatePostModal({
  open,
  onClose,
  onPublish,
  childList,
}: CreatePostModalProps) {
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [description, setDescription] = useState("");

  const [dataState, setDataState] = useState<"open" | "closing">();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const shouldRender = open || dataState === "closing";

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const isFormValid =
    recipient !== null &&
    (recipient.kind !== "children" || recipient.childIds.length > 0) &&
    selectedType !== null &&
    description.trim().length > 0;

  const handleClose = useCallback(() => {
    setRecipient(null);
    setSelectedType(null);
    setDescription("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDataState("open"));
    });
    const focusTimer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(focusTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open && dataState === "open") {
      queueMicrotask(() => setDataState("closing"));
    }
    if (dataState === "closing") {
      const timer = setTimeout(() => {
        setDataState(undefined);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, dataState]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (dataState !== "open") return;
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dataState, handleClose]);

  function toggleChild(child: Child) {
    setRecipient((prev) => {
      if (prev?.kind === "children") {
        const nextIds = prev.childIds.includes(child.id)
          ? prev.childIds.filter((id) => id !== child.id)
          : [...prev.childIds, child.id];
        return nextIds.length > 0 ? { kind: "children", childIds: nextIds } : null;
      }
      return { kind: "children", childIds: [child.id] };
    });
  }

  function toggleRoom() {
    setRecipient((prev) =>
      prev?.kind === "room" ? null : { kind: "room", label: "Toda la sala" }
    );
  }

  function handlePublish() {
    if (!isFormValid || !recipient || !selectedType) return;

    let authorName: string;
    let authorInitial: string;
    let authorAvatarBg: string;
    let authorAvatarColor: string;
    let recipientLabel: string;

    if (recipient.kind === "room") {
      authorName = "Anuncio general";
      authorInitial = "";
      authorAvatarBg = "#CCD8F4";
      authorAvatarColor = "#4E72C8";
      recipientLabel = "toda la sala";
    } else {
      const selectedChildren = recipient.childIds
        .map((id) => childList.find((c) => c.id === id))
        .filter((c): c is Child => Boolean(c));
      if (selectedChildren.length === 0) return;

      const names = selectedChildren.map((c) => c.name.split(" ")[0]);
      recipientLabel =
        names.length === 1
          ? `familia de ${names[0]}`
          : `familias de ${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
      authorName = names[0];
      authorInitial = selectedChildren[0].initial;
      authorAvatarBg = selectedChildren[0].avatarBg;
      authorAvatarColor = selectedChildren[0].avatarColor;
    }

    const newPost: FeedPost = {
      id: crypto.randomUUID(),
      authorName,
      authorInitial,
      authorAvatarBg,
      authorAvatarColor,
      timeLabel: new Date().toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      postedByLabel: "publicado por vos",
      recipientLabel,
      type: selectedType,
      text: description,
      hearts: 0,
      comments: 0,
    };

    onPublish(newPost);
    setRecipient(null);
    setSelectedType(null);
    setDescription("");
    onClose();
  }

  if (!shouldRender) return null;

  const recipientPillSelected = "border-text bg-text text-white";
  const recipientPillUnselected = "border-border bg-card text-nav-inactive";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-6">
      <div
        className="modal-overlay absolute inset-0 bg-black/40"
        data-state={dataState}
        onClick={handleClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-modal-title"
        className="modal-card relative w-full max-w-[580px] bg-[#FBF4EC] border border-border rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
        data-state={dataState}
      >
        <div className="flex items-center justify-between px-[26px] py-5 border-b border-border">
          <button
            type="button"
            onClick={handleClose}
            className="text-[15px] font-bold text-[#94887B] hover:text-text transition duration-150 active:scale-[0.97]"
          >
            Cancelar
          </button>
          <span
            id="create-post-modal-title"
            className="font-fredoka font-semibold text-[18px] text-text"
          >
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!isFormValid}
            className="text-[15px] font-extrabold text-nav-active-text disabled:text-[#C4B8AA] disabled:cursor-not-allowed transition duration-150 active:scale-[0.97]"
          >
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-[10px]">
            PARA
          </div>
          <div className="flex flex-wrap gap-[9px] mb-[22px]">
            {childList.map((child) => {
              const firstName = child.name.split(" ")[0];
              const isSelected =
                recipient?.kind === "children" &&
                recipient.childIds.includes(child.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleChild(child)}
                  className={`flex items-center gap-2 py-[6px] pl-[6px] pr-[14px] rounded-full border-[1.5px] font-bold text-[14px] cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? recipientPillSelected
                      : recipientPillUnselected
                  }`}
                >
                  <span
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-fredoka font-semibold text-[13px] flex-none"
                    style={{
                      backgroundColor: child.avatarBg,
                      color: child.avatarColor,
                    }}
                  >
                    {child.initial}
                  </span>
                  {firstName}
                </button>
              );
            })}
            <button
              type="button"
              onClick={toggleRoom}
              className={`py-[6px] px-4 rounded-full border-[1.5px] font-bold text-[14px] cursor-pointer transition-colors duration-200 ${
                recipient?.kind === "room"
                  ? recipientPillSelected
                  : recipientPillUnselected
              }`}
            >
              Toda la sala
            </button>
          </div>

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-[10px]">
            TIPO
          </div>
          <div className="flex flex-wrap gap-[9px] mb-[22px]">
            {(Object.keys(POST_TYPE_LABELS) as PostType[]).map((type) => {
              const colors = POST_TYPE_COLORS[type];
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                  className={`py-2 px-4 rounded-full font-extrabold text-[13.5px] cursor-pointer transition duration-150 ${
                    isSelected
                      ? "ring-2 ring-text ring-offset-2 ring-offset-[#FBF4EC]"
                      : ""
                  }`}
                >
                  {POST_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-[10px]">
            DESCRIPCIÓN
          </div>
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Descripción"
            placeholder="Contá cómo le fue hoy…"
            className="modal-input w-full min-h-[120px] resize-y py-[14px] px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-text placeholder:text-[#B6A99B] leading-normal mb-[22px] transition-colors duration-200 focus:outline-none focus:border-coral-dark focus:ring-2 focus:ring-coral-light/20 focus:ring-offset-0"
          />

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-[10px]">
            FOTOS
          </div>
          <div className="flex gap-3">
            <div className="w-24 h-24 rounded-[14px] bg-photo-placeholder-bg border border-border flex items-center justify-center text-photo-placeholder-text">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
              </svg>
            </div>
            <button
              type="button"
              className="w-24 h-24 rounded-[14px] border-[1.5px] border-dashed border-photo-placeholder-border bg-photo-placeholder-bg flex flex-col items-center justify-center gap-1.5 text-photo-placeholder-text cursor-pointer"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-edit"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-[12px]">Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
