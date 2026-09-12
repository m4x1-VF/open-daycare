"use client";

import { useEffect, useState } from "react";
import { fetchPokemon } from "@/lib/pokeapi";
import type { Pokemon } from "@/lib/pokeapi";
import { PokemonCard } from "@/components/pokemon-card";

export function PokemonNavigator() {
  const [id, setId] = useState(1);
  const [result, setResult] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "success"; pokemon: Pokemon }
  >({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetchPokemon(id, controller.signal)
      .then((data) => {
        setResult({ status: "success", pokemon: data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ status: "error" });
        console.error("Failed to load pokemon", error);
      });

    return () => controller.abort();
  }, [id]);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 p-8">
      {result.status === "success" && <PokemonCard pokemon={result.pokemon} />}

      {result.status === "loading" && (
        <p className="text-lg text-slate-500">Loading…</p>
      )}

      {result.status === "error" && (
        <p className="text-lg text-red-500">Something went wrong</p>
      )}

      <div className="flex w-full gap-3">
        <button
          type="button"
          disabled={id === 1 || result.status === "loading"}
          onClick={() => setId((current) => Math.max(1, current - 1))}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-2 text-white disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => setId((current) => current + 1)}
          disabled={result.status === "loading"}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-2 text-white disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
