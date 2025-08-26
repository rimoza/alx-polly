-- ============================================================================
-- POLLING APP DATABASE SCHEMA
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PROFILES TABLE (extends Supabase Auth)
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- POLLS TABLE
-- ============================================================================
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 1000),
  share_id TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8), -- Short ID for sharing
  qr_code_url TEXT, -- URL to generated QR code
  settings JSONB DEFAULT '{
    "multiple_choice": false,
    "show_results": "after_vote",
    "allow_anonymous": true,
    "require_auth": false,
    "close_at": null,
    "max_votes_per_user": 1,
    "allow_vote_change": false
  }'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  vote_count INTEGER DEFAULT 0, -- Cached vote count for performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- ============================================================================
-- POLL OPTIONS TABLE
-- ============================================================================
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  position INTEGER NOT NULL,
  vote_count INTEGER DEFAULT 0, -- Cached vote count for performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique positions within a poll
  UNIQUE(poll_id, position)
);

-- ============================================================================
-- VOTES TABLE - COMPREHENSIVE DUPLICATE PREVENTION
-- ============================================================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  
  -- User identification (authenticated users)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Anonymous user identification
  session_id TEXT, -- Browser session ID
  fingerprint_hash TEXT, -- Browser fingerprint hash
  ip_hash TEXT, -- Hashed IP address for privacy
  
  -- Vote metadata
  user_agent_hash TEXT, -- Hashed user agent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ========================================================================
  -- DUPLICATE PREVENTION CONSTRAINTS
  -- ========================================================================
  
  -- Constraint 1: One vote per authenticated user per poll
  CONSTRAINT unique_user_poll UNIQUE(poll_id, user_id),
  
  -- Constraint 2: One vote per session per poll (for anonymous users)
  CONSTRAINT unique_session_poll UNIQUE(poll_id, session_id),
  
  -- Constraint 3: One vote per fingerprint per poll (additional protection)
  CONSTRAINT unique_fingerprint_poll UNIQUE(poll_id, fingerprint_hash),
  
  -- Ensure we have at least one identifier
  CONSTRAINT vote_identifier_check CHECK (
    user_id IS NOT NULL OR 
    (session_id IS NOT NULL AND fingerprint_hash IS NOT NULL)
  )
);

-- ============================================================================
-- VOTE ATTEMPTS TABLE - Track suspicious voting attempts
-- ============================================================================
CREATE TABLE vote_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_hash TEXT,
  fingerprint_hash TEXT,
  attempt_type TEXT CHECK (attempt_type IN ('duplicate', 'rate_limit', 'invalid_poll', 'poll_closed')),
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MATERIALIZED VIEW FOR POLL RESULTS
-- ============================================================================
CREATE MATERIALIZED VIEW poll_results AS
SELECT 
  p.id as poll_id,
  p.title,
  p.status,
  po.id as option_id,
  po.text as option_text,
  po.position,
  po.vote_count,
  CASE 
    WHEN p.vote_count > 0 THEN 
      ROUND((po.vote_count::numeric / p.vote_count::numeric) * 100, 2)
    ELSE 0 
  END as percentage,
  p.created_at as poll_created_at,
  p.updated_at as poll_updated_at
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
ORDER BY p.created_at DESC, po.position ASC;

-- Create index for faster refresh
CREATE UNIQUE INDEX ON poll_results (poll_id, option_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update vote counts (called by triggers)
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update option vote count
  UPDATE poll_options 
  SET vote_count = (
    SELECT COUNT(*) FROM votes WHERE option_id = NEW.option_id
  )
  WHERE id = NEW.option_id;
  
  -- Update poll total vote count
  UPDATE polls 
  SET vote_count = (
    SELECT COUNT(*) FROM votes WHERE poll_id = NEW.poll_id
  )
  WHERE id = NEW.poll_id;
  
  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY poll_results;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to hash sensitive data
CREATE OR REPLACE FUNCTION hash_sensitive_data(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(input_text || current_setting('app.hash_salt', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update vote counts when vote is inserted
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();

-- Update timestamps
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime('updated_at');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile and public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Polls: Public polls are viewable, creators can manage their own
CREATE POLICY "Active polls are viewable by everyone" 
  ON polls FOR SELECT 
  USING (status IN ('active', 'closed'));

CREATE POLICY "Users can manage own polls" 
  ON polls FOR ALL 
  USING (auth.uid() = creator_id);

-- Poll options: Viewable with their polls
CREATE POLICY "Poll options are viewable with polls" 
  ON poll_options FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE id = poll_id AND status IN ('active', 'closed')
    )
  );

CREATE POLICY "Poll creators can manage options" 
  ON poll_options FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE id = poll_id AND auth.uid() = creator_id
    )
  );

-- Votes: Prevent duplicate voting and allow viewing aggregated results
CREATE POLICY "Users can vote once per poll" 
  ON votes FOR INSERT 
  WITH CHECK (
    -- Check poll is active
    EXISTS (
      SELECT 1 FROM polls 
      WHERE id = poll_id AND status = 'active'
    ) AND
    -- Prevent duplicate votes
    NOT EXISTS (
      SELECT 1 FROM votes 
      WHERE poll_id = NEW.poll_id AND (
        (user_id IS NOT NULL AND user_id = auth.uid()) OR
        (session_id IS NOT NULL AND session_id = NEW.session_id) OR
        (fingerprint_hash IS NOT NULL AND fingerprint_hash = NEW.fingerprint_hash)
      )
    )
  );

-- Vote attempts: Only system can insert
CREATE POLICY "System can log vote attempts" 
  ON vote_attempts FOR INSERT 
  WITH CHECK (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_polls_creator_id ON polls(creator_id);
CREATE INDEX idx_polls_share_id ON polls(share_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_position ON poll_options(poll_id, position);

-- Vote prevention indexes
CREATE INDEX idx_votes_poll_user ON votes(poll_id, user_id);
CREATE INDEX idx_votes_poll_session ON votes(poll_id, session_id);
CREATE INDEX idx_votes_poll_fingerprint ON votes(poll_id, fingerprint_hash);
CREATE INDEX idx_votes_ip_hash ON votes(ip_hash, created_at);

-- Performance indexes
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- Security monitoring indexes
CREATE INDEX idx_vote_attempts_poll_id ON vote_attempts(poll_id);
CREATE INDEX idx_vote_attempts_ip_hash ON vote_attempts(ip_hash, created_at);
CREATE INDEX idx_vote_attempts_created_at ON vote_attempts(created_at DESC);

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Set default hash salt (should be set via environment variable in production)
-- This is used by the hash_sensitive_data function
-- ALTER DATABASE SET app.hash_salt = 'your-secure-salt-here';