CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE relationship_type AS ENUM ('mom', 'dad', 'guardian');

CREATE TABLE invitations (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid              NOT NULL REFERENCES children(id),
  invited_by    uuid              NOT NULL REFERENCES auth.users(id),
  full_name     text              NOT NULL,
  email         text              NOT NULL,
  relationship  relationship_type NOT NULL,
  code          text              NOT NULL UNIQUE,
  status        invitation_status NOT NULL DEFAULT 'pending',
  expires_at    timestamptz       NOT NULL,
  accepted_at   timestamptz,
  created_at    timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_child_id ON invitations (child_id);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_read
  ON invitations FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON c.room_id = r.id
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

CREATE POLICY invitations_insert
  ON invitations FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON c.room_id = r.id
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );
