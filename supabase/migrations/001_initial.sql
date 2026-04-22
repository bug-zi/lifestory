-- ============================================================================
-- Migration: 001_initial (Idempotent)
-- Description: Initial schema for 人生副本 (Life Script) application
-- Created: 2026-04-20
-- Usage: Can be safely re-run in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- CLEANUP: Drop existing objects in reverse dependency order
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.deduct_token(UUID, TEXT, INT, TEXT);
DROP FUNCTION IF EXISTS public.add_token(UUID, TEXT, INT, TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop policies (must precede table drop)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'orders','diy_generations','script_ratings','my_library',
        'check_ins','token_transactions','user_tokens','scripts','profiles'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Drop indexes (non-primary, non-unique-constraint)
DROP INDEX IF EXISTS public.idx_orders_created_at;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_user_id;
DROP INDEX IF EXISTS public.idx_diy_generations_status;
DROP INDEX IF EXISTS public.idx_diy_generations_user_id;
DROP INDEX IF EXISTS public.idx_script_ratings_user_id;
DROP INDEX IF EXISTS public.idx_script_ratings_script_id;
DROP INDEX IF EXISTS public.idx_my_library_user_id;
DROP INDEX IF EXISTS public.idx_check_ins_check_in_date;
DROP INDEX IF EXISTS public.idx_check_ins_user_id;
DROP INDEX IF EXISTS public.idx_token_transactions_created_at;
DROP INDEX IF EXISTS public.idx_token_transactions_user_id;
DROP INDEX IF EXISTS public.idx_user_tokens_user_id;
DROP INDEX IF EXISTS public.idx_scripts_created_at;
DROP INDEX IF EXISTS public.idx_scripts_is_official;
DROP INDEX IF EXISTS public.idx_scripts_tags;
DROP INDEX IF EXISTS public.idx_scripts_author_id;
DROP INDEX IF EXISTS public.idx_scripts_era;
DROP INDEX IF EXISTS public.idx_scripts_category;
DROP INDEX IF EXISTS public.idx_scripts_mood;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.diy_generations CASCADE;
DROP TABLE IF EXISTS public.script_ratings CASCADE;
DROP TABLE IF EXISTS public.my_library CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.token_transactions CASCADE;
DROP TABLE IF EXISTS public.user_tokens CASCADE;
DROP TABLE IF EXISTS public.scripts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- 1. PROFILES TABLE (extends Supabase Auth)
-- ============================================================================
CREATE TABLE public.profiles (
    id              UUID            PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username        TEXT            UNIQUE,
    avatar_url      TEXT,
    is_member       BOOLEAN         DEFAULT FALSE,
    member_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================================
-- 2. SCRIPTS TABLE
-- ============================================================================
CREATE TABLE public.scripts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT            NOT NULL,
    subtitle        TEXT,
    content         TEXT            NOT NULL,
    cover_image     TEXT,
    tags            TEXT[]          DEFAULT '{}',
    mood            TEXT,
    category        TEXT,
    era             TEXT,
    word_count      INT,
    author_id       UUID            REFERENCES public.profiles(id),
    is_official     BOOLEAN         DEFAULT TRUE,
    view_count      INT             DEFAULT 0,
    rating_avg      DECIMAL(3,2),
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================================
-- 3. USER_TOKENS TABLE
-- ============================================================================
CREATE TABLE public.user_tokens (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id),
    token_type      TEXT            NOT NULL CHECK (token_type IN ('script', 'diy')),
    balance         INT             DEFAULT 0,
    updated_at      TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(user_id, token_type)
);

-- ============================================================================
-- 4. TOKEN_TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE public.token_transactions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id),
    token_type      TEXT            NOT NULL CHECK (token_type IN ('script', 'diy')),
    amount          INT             NOT NULL,
    reason          TEXT            NOT NULL,
    ref_id          UUID,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================================
-- 5. CHECK_INS TABLE
-- ============================================================================
CREATE TABLE public.check_ins (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id),
    check_in_date   DATE            NOT NULL,
    reward_type     TEXT            DEFAULT 'script',
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(user_id, check_in_date)
);

-- ============================================================================
-- 6. MY_LIBRARY TABLE
-- ============================================================================
CREATE TABLE public.my_library (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id),
    script_id       UUID            REFERENCES public.scripts(id),
    custom_content  TEXT,
    is_customized   BOOLEAN         DEFAULT FALSE,
    note            TEXT,
    saved_at        TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

-- ============================================================================
-- 7. SCRIPT_RATINGS TABLE
-- ============================================================================
CREATE TABLE public.script_ratings (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id),
    script_id       UUID            NOT NULL REFERENCES public.scripts(id),
    rating          INT             CHECK (rating BETWEEN 1 AND 5),
    highlight_text  TEXT,
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

-- ============================================================================
-- 8. DIY_GENERATIONS TABLE
-- ============================================================================
CREATE TABLE public.diy_generations (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL REFERENCES public.profiles(id),
    input_life              TEXT            NOT NULL,
    questions               JSONB,
    generated_script_id     UUID            REFERENCES public.scripts(id),
    status                  TEXT            DEFAULT 'pending',
    created_at              TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================================
-- 9. ORDERS TABLE
-- ============================================================================
CREATE TABLE public.orders (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id),
    order_type      TEXT            NOT NULL,
    amount_cents    INT             NOT NULL,
    quantity        INT,
    status          TEXT            DEFAULT 'pending',
    payment_method  TEXT,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================================
-- AUTO-CREATE PROFILE + INITIALIZE TOKENS ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );

    INSERT INTO public.user_tokens (user_id, token_type, balance) VALUES
        (NEW.id, 'script', 1),
        (NEW.id, 'diy', 0);

    RETURN NEW;
END;
$func$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_library         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_ratings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diy_generations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- --- profiles ---
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --- scripts ---
CREATE POLICY "Scripts are viewable by everyone"
    ON public.scripts FOR SELECT
    USING (TRUE);

CREATE POLICY "Authors can insert own scripts"
    ON public.scripts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own scripts"
    ON public.scripts FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- --- user_tokens ---
CREATE POLICY "Users can read own tokens"
    ON public.user_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can update tokens"
    ON public.user_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert tokens"
    ON public.user_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- --- token_transactions ---
CREATE POLICY "Users can read own transactions"
    ON public.token_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
    ON public.token_transactions FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- --- check_ins ---
CREATE POLICY "Users can read own check-ins"
    ON public.check_ins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
    ON public.check_ins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- --- my_library ---
CREATE POLICY "Users can read own library"
    ON public.my_library FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own library entries"
    ON public.my_library FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own library entries"
    ON public.my_library FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own library entries"
    ON public.my_library FOR DELETE
    USING (auth.uid() = user_id);

-- --- script_ratings ---
CREATE POLICY "Ratings are viewable by everyone"
    ON public.script_ratings FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert own ratings"
    ON public.script_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON public.script_ratings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- --- diy_generations ---
CREATE POLICY "Users can read own diy generations"
    ON public.diy_generations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diy generations"
    ON public.diy_generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diy generations"
    ON public.diy_generations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diy generations"
    ON public.diy_generations FOR DELETE
    USING (auth.uid() = user_id);

-- --- orders ---
CREATE POLICY "Users can read own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update orders"
    ON public.orders FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_scripts_mood            ON public.scripts (mood);
CREATE INDEX idx_scripts_category        ON public.scripts (category);
CREATE INDEX idx_scripts_era             ON public.scripts (era);
CREATE INDEX idx_scripts_author_id       ON public.scripts (author_id);
CREATE INDEX idx_scripts_tags            ON public.scripts USING GIN (tags);
CREATE INDEX idx_scripts_is_official     ON public.scripts (is_official);
CREATE INDEX idx_scripts_created_at      ON public.scripts (created_at DESC);

CREATE INDEX idx_user_tokens_user_id     ON public.user_tokens (user_id);

CREATE INDEX idx_token_transactions_user_id      ON public.token_transactions (user_id);
CREATE INDEX idx_token_transactions_created_at   ON public.token_transactions (created_at DESC);

CREATE INDEX idx_check_ins_user_id       ON public.check_ins (user_id);
CREATE INDEX idx_check_ins_check_in_date ON public.check_ins (check_in_date DESC);

CREATE INDEX idx_my_library_user_id      ON public.my_library (user_id);

CREATE INDEX idx_script_ratings_script_id ON public.script_ratings (script_id);
CREATE INDEX idx_script_ratings_user_id   ON public.script_ratings (user_id);

CREATE INDEX idx_diy_generations_user_id  ON public.diy_generations (user_id);
CREATE INDEX idx_diy_generations_status   ON public.diy_generations (status);

CREATE INDEX idx_orders_user_id           ON public.orders (user_id);
CREATE INDEX idx_orders_status            ON public.orders (status);
CREATE INDEX idx_orders_created_at        ON public.orders (created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS FOR TOKEN MANAGEMENT
-- ============================================================================

-- Add tokens to a user (with transaction record)
CREATE OR REPLACE FUNCTION public.add_token(
    p_user_id UUID,
    p_token_type TEXT,
    p_amount INT,
    p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    INSERT INTO public.user_tokens (user_id, token_type, balance)
    VALUES (p_user_id, p_token_type, p_amount)
    ON CONFLICT (user_id, token_type)
    DO UPDATE SET balance = user_tokens.balance + p_amount, updated_at = NOW();

    INSERT INTO public.token_transactions (user_id, token_type, amount, reason)
    VALUES (p_user_id, p_token_type, p_amount, p_reason);
END;
$func$;

-- Deduct tokens from a user (with transaction record)
CREATE OR REPLACE FUNCTION public.deduct_token(
    p_user_id UUID,
    p_token_type TEXT,
    p_amount INT,
    p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_balance INT;
BEGIN
    SELECT balance INTO v_balance
    FROM public.user_tokens
    WHERE user_id = p_user_id AND token_type = p_token_type
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient token balance';
    END IF;

    UPDATE public.user_tokens
    SET balance = balance - p_amount, updated_at = NOW()
    WHERE user_id = p_user_id AND token_type = p_token_type;

    INSERT INTO public.token_transactions (user_id, token_type, amount, reason)
    VALUES (p_user_id, p_token_type, -p_amount, p_reason);
END;
$func$;
