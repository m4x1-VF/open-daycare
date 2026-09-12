import type { Pokemon } from "@/lib/pokeapi";

export function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  const artwork = pokemon.sprites.other["official-artwork"].front_default;

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-md">
      <h2 className="text-center text-xl font-semibold text-slate-800">
        #{pokemon.id} {pokemon.name}
      </h2>

      {artwork && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artwork}
          alt={pokemon.name}
          width={200}
          height={200}
          className="mx-auto"
        />
      )}

      <ul className="flex justify-center gap-2">
        {pokemon.types.map(({ type }) => (
          <li
            key={type.name}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-700"
          >
            {type.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
