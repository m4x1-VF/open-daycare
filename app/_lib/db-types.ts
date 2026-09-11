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

export interface DbInvitation {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  relationship: "mom" | "dad" | "guardian";
  code: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
