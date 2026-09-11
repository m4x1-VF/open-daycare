-- SPEC 12: parent_children table + RLS + get_invitation_preview security definer

CREATE TABLE parent_children (
  id             uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      uuid               NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id       uuid               NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship   relationship_type  NOT NULL,
  photo_consent  boolean            NOT NULL DEFAULT false,
  created_at     timestamptz        NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY parent_children_read
  ON parent_children FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.rooms r ON c.room_id = r.id
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

CREATE POLICY parent_children_insert_self
  ON parent_children FOR INSERT TO authenticated
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.get_invitation_preview(p_code text)
RETURNS TABLE (
  status          invitation_status,
  code            text,
  full_name       text,
  email           text,
  child_name      text,
  room_name       text,
  avatar_initial  text,
  daycare_id      uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.status,
    i.code,
    i.full_name,
    i.email,
    c.full_name AS child_name,
    r.name       AS room_name,
    UPPER(LEFT(i.full_name, 1)) AS avatar_initial,
    r.daycare_id
  FROM public.invitations i
  JOIN public.children c   ON c.id = i.child_id
  JOIN public.rooms    r   ON r.id = c.room_id
  WHERE i.code = p_code
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_invitation_preview(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;
