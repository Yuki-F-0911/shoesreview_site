-- Enable Row Level Security (RLS) on all tables
-- Since this application uses Prisma ORM through Next.js API routes,
-- we'll enable RLS but allow all operations for authenticated users
-- and service role (used by Prisma)

-- Enable RLS on all tables
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShoeMedia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CuratedSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access (used by Prisma)
-- _prisma_migrations: Only service role should access
CREATE POLICY "Service role can manage migrations" ON public._prisma_migrations
    FOR ALL USING (auth.role() = 'service_role');

-- verification_tokens: Service role access
CREATE POLICY "Service role full access" ON public.verification_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- users: Service role full access, public read for basic info
CREATE POLICY "Service role full access on users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can read user profiles" ON public.users
    FOR SELECT USING (true);

-- accounts: Service role only
CREATE POLICY "Service role full access on accounts" ON public.accounts
    FOR ALL USING (auth.role() = 'service_role');

-- sessions: Service role only
CREATE POLICY "Service role full access on sessions" ON public.sessions
    FOR ALL USING (auth.role() = 'service_role');

-- shoes: Public read, service role write
CREATE POLICY "Anyone can view shoes" ON public.shoes
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage shoes" ON public.shoes
    FOR ALL USING (auth.role() = 'service_role');

-- ShoeMedia: Public read, service role write
CREATE POLICY "Anyone can view shoe media" ON public."ShoeMedia"
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage shoe media" ON public."ShoeMedia"
    FOR ALL USING (auth.role() = 'service_role');

-- CuratedSource: Public read, service role write
CREATE POLICY "Anyone can view curated sources" ON public."CuratedSource"
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage curated sources" ON public."CuratedSource"
    FOR ALL USING (auth.role() = 'service_role');

-- ai_sources: Public read, service role write
CREATE POLICY "Anyone can view AI sources" ON public.ai_sources
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage AI sources" ON public.ai_sources
    FOR ALL USING (auth.role() = 'service_role');

-- reviews: Public read, service role write
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage reviews" ON public.reviews
    FOR ALL USING (auth.role() = 'service_role');

-- comments: Public read, service role write
CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage comments" ON public.comments
    FOR ALL USING (auth.role() = 'service_role');

-- likes: Public read, service role write
CREATE POLICY "Anyone can view likes" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage likes" ON public.likes
    FOR ALL USING (auth.role() = 'service_role');
