export interface DbRoom {
  id: string;
  daycare_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbChild {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}
