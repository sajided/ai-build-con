-- /docs module: visibility schedule, draft/published content and version history.
-- Only the server (service role) reads or writes these tables: RLS is on with no policies,
-- so the anon and authenticated roles get nothing.

CREATE TABLE IF NOT EXISTS public.docs_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    time_zone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT,
    CONSTRAINT docs_window_order CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at)
);

-- Default judging window: 18 Nov 00:00 → 18 Dec 23:59, Dhaka time
INSERT INTO public.docs_settings (id, enabled, start_at, end_at)
VALUES (1, TRUE, '2026-11-18T00:00:00+06:00', '2026-12-18T23:59:59+06:00')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.docs_content (
    id TEXT PRIMARY KEY CHECK (id IN ('draft', 'published')),
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS public.docs_versions (
    id BIGSERIAL PRIMARY KEY,
    content JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

ALTER TABLE public.docs_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs_versions ENABLE ROW LEVEL SECURITY;
