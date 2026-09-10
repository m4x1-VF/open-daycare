-- SPEC 08 — Trigger on_auth_user_created (specs/08-auth-y-proteccion-rutas.md)
-- Applied to remote project dkwzoobnaaxxpovxxgvt via Supabase MCP on 2026-09-10.
-- Creates the public.users row automatically on every auth.users insert,
-- reading daycare_id, role, status and full_name from raw_user_meta_data.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, status, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'daycare_id')::uuid,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    COALESCE((NEW.raw_user_meta_data->>'status')::public.user_status, 'active'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger functions can only be invoked by triggers, but EXECUTE is granted to
-- PUBLIC by default. Revoke it so the RPC endpoint never exposes the function.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
