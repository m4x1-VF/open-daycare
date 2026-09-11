CREATE TYPE child_status AS ENUM ('active', 'archived');

CREATE TABLE rooms (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid        NOT NULL REFERENCES daycares(id),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE children (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid           NOT NULL REFERENCES rooms(id),
  full_name     text           NOT NULL,
  birth_date    date           NOT NULL,
  enrolled_at   date           NOT NULL DEFAULT CURRENT_DATE,
  medical_notes text,
  allergy_tags  text[]         NOT NULL DEFAULT '{}',
  photo_consent boolean        NOT NULL DEFAULT true,
  status        child_status   NOT NULL DEFAULT 'active',
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY rooms_read
  ON rooms FOR SELECT TO authenticated
  USING (daycare_id = (SELECT private.get_user_daycare_id()));

CREATE POLICY children_read
  ON children FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

CREATE POLICY children_insert
  ON children FOR INSERT TO authenticated
  WITH CHECK (
    room_id IN (
      SELECT r.id FROM rooms r
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

INSERT INTO rooms (daycare_id, name)
SELECT id, name FROM (VALUES
  ('Soles'),
  ('Terra'),
  ('Luna')
) AS v(name)
CROSS JOIN (
  SELECT id FROM daycares WHERE name = 'Guardería Sala Soles'
) AS d;
