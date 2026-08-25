"use client";

import { useState } from "react";
import { Child } from "@/app/_lib/child-types";
import { ROOMS } from "@/app/_lib/rooms";

interface AddChildModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (child: Child) => void;
}

function isValidDate(value: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split("/").map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
}

export default function AddChildModal({
  open,
  onClose,
  onSave,
}: AddChildModalProps) {
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [room, setRoom] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [touchedName, setTouchedName] = useState(false);
  const [touchedBirthdate, setTouchedBirthdate] = useState(false);
  const [touchedRoom, setTouchedRoom] = useState(false);

  const nameError = touchedName && !name.trim() ? "El nombre es obligatorio" : "";
  const birthdateError = touchedBirthdate
    ? !birthdate.trim()
      ? "La fecha es obligatoria"
      : !isValidDate(birthdate)
        ? "Formato inválido (dd/mm/aaaa)"
        : ""
    : "";
  const roomError = touchedRoom && !room ? "Seleccioná una sala" : "";

  const isFormValid =
    name.trim().length > 0 &&
    isValidDate(birthdate) &&
    room.length > 0;

  function resetForm() {
    setName("");
    setBirthdate("");
    setRoom("");
    setAllergies("");
    setMedicalNotes("");
    setTouchedName(false);
    setTouchedBirthdate(false);
    setTouchedRoom(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSave() {
    setTouchedName(true);
    setTouchedBirthdate(true);
    setTouchedRoom(true);

    if (!isFormValid) return;

    const [day, month, year] = birthdate.split("/").map(Number);
    const birth = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    const months = [
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic",
    ];
    const birthdateLabel = `${day} ${months[month - 1]} ${year}`;
    const admissionLabel = `${months[today.getMonth()]} ${today.getFullYear()}`;

    const allergens = allergies
      .split(",")
      .map((a) => a.trim().toUpperCase())
      .filter((a) => a.length > 0);

    const newChild: Child = {
      id: crypto.randomUUID(),
      name: name.trim(),
      initial: name.trim()[0].toUpperCase(),
      avatarBg: "",
      avatarColor: "",
      ageYears: age,
      birthdateLabel,
      room,
      admissionLabel,
      allergens,
      allergyNotes: allergies || undefined,
      linkedParents: [],
    };

    onSave(newChild);
    resetForm();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-6">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-[520px] bg-[#FBF4EC] border border-border rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">
        <div className="flex items-center justify-between px-[26px] py-5 border-b border-border">
          <button
            type="button"
            onClick={handleClose}
            className="text-[15px] font-bold text-[#94887B] hover:text-text transition-colors"
          >
            Cancelar
          </button>
          <span className="font-fredoka font-semibold text-[18px] text-text">
            Agregar niño
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid}
            className="text-[15px] font-extrabold text-coral-dark disabled:text-[#C4B8AA] disabled:cursor-not-allowed transition-colors"
          >
            Guardar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2">
            NOMBRE COMPLETO
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouchedName(true)}
            placeholder="Ej. Martina López"
            className={`w-full py-[13px] px-4 rounded-[14px] border-[1.5px] bg-white text-[15px] text-text placeholder:text-[#B6A99B] mb-1 ${
              nameError ? "border-red-400" : "border-[#EADFD0]"
            }`}
          />
          {nameError && (
            <div className="text-[12px] text-red-500 mb-3">{nameError}</div>
          )}
          {!nameError && <div className="mb-[18px]" />}

          <div className="flex gap-[14px] mb-[18px]">
            <div className="flex-1">
              <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2">
                FECHA DE NACIMIENTO
              </div>
              <input
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                onBlur={() => setTouchedBirthdate(true)}
                placeholder="dd/mm/aaaa"
                className={`w-full py-[13px] px-4 rounded-[14px] border-[1.5px] bg-white text-[15px] text-text placeholder:text-[#B6A99B] ${
                  birthdateError ? "border-red-400" : "border-[#EADFD0]"
                }`}
              />
              {birthdateError && (
                <div className="text-[12px] text-red-500 mt-1">
                  {birthdateError}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2">
                SALA
              </div>
              <div className="relative">
                <select
                  value={room}
                  onChange={(e) => {
                    setRoom(e.target.value);
                    setTouchedRoom(true);
                  }}
                  onBlur={() => setTouchedRoom(true)}
                  className={`w-full py-[13px] px-4 rounded-[14px] border-[1.5px] bg-white text-[15px] font-bold text-text appearance-none cursor-pointer ${
                    roomError ? "border-red-400" : "border-[#EADFD0]"
                  } ${!room ? "text-[#B6A99B] font-normal" : ""}`}
                >
                  <option value="" disabled>
                    Seleccionar sala
                  </option>
                  {ROOMS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B0A290"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {roomError && (
                <div className="text-[12px] text-red-500 mt-1">
                  {roomError}
                </div>
              )}
            </div>
          </div>

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2">
            ALERGIAS (ETIQUETAS)
          </div>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Ej. Maní, Lactosa"
            className="w-full py-[13px] px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-text placeholder:text-[#B6A99B] mb-[18px]"
          />

          <div className="text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2">
            NOTAS MÉDICAS
          </div>
          <textarea
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            placeholder="Indicaciones, medicación, contactos…"
            className="w-full min-h-[90px] resize-y py-[13px] px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-text placeholder:text-[#B6A99B] leading-normal"
          />
        </div>
      </div>
    </div>
  );
}
