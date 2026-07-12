-- ============================================================
-- 002: Server-side entitlements, resumes table, RLS fixes
-- ============================================================

-- ── Profiles: server-side source of truth for user tier ─────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  stripe_payment_intent_id TEXT,
  upgraded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND tier = 'free');

-- Tier can only be changed by the service role (Stripe webhook / verified
-- payment API). Column-level privileges block authenticated users from
-- updating `tier` directly even if an UPDATE policy exists later.
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

-- Auto-create a profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ── Resumes table (was missing from migrations entirely) ────
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON public.resumes(user_id);
-- PUT/DELETE match on the client resume id stored inside the JSON payload
CREATE INDEX IF NOT EXISTS idx_resumes_data_id ON public.resumes ((data->>'id'));
-- One row per (user, client resume id) — prevents duplicate rows on sync races
CREATE UNIQUE INDEX IF NOT EXISTS uq_resumes_user_data_id ON public.resumes (user_id, (data->>'id'));

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own resumes" ON public.resumes;
CREATE POLICY "Users manage own resumes"
  ON public.resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Feedback: fix broken admin SELECT/DELETE policies ───────
-- The old SELECT policy was granted only to service_role, so the admin
-- dashboard (which queries with the user's session) always saw an empty
-- list, and DELETE had no policy at all (silently deleted nothing).
DROP POLICY IF EXISTS "Allow admin view" ON public.feedback;
CREATE POLICY "Allow whitelisted admin view"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_whitelist w
      WHERE w.email = (auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "Allow whitelisted admin delete" ON public.feedback;
CREATE POLICY "Allow whitelisted admin delete"
  ON public.feedback FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_whitelist w
      WHERE w.email = (auth.jwt() ->> 'email')
    )
  );

-- ── Public templates: tie rows to real authenticated users ──
-- Publish/unpublish now go through the user's session, so the existing
-- auth.uid() policies finally work. Nothing to change structurally, but
-- make user_id required going forward.
DELETE FROM public.public_templates WHERE user_id IS NULL;
ALTER TABLE public.public_templates ALTER COLUMN user_id SET NOT NULL;
