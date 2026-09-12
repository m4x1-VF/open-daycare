export interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
}

export const POKEMON_LIMIT = 1025;

export async function fetchPokemon(id: number, signal?: AbortSignal) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${id}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`PokeAPI responded with ${response.status}`);
  }

  return (await response.json()) as Pokemon;
}
