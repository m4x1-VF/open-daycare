"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
