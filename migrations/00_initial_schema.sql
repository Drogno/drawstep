-- =============================================
-- Initial Database Schema for Lorcana Mulligan Trainer
-- =============================================

-- Note: auth.users table is managed by Supabase and already has RLS enabled

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  settings JSONB DEFAULT '{}' NOT NULL,
  telemetry_consent BOOLEAN DEFAULT NULL, -- null = not decided, true = consented, false = denied

  -- Constraints
  CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT profiles_settings_valid_json CHECK (jsonb_typeof(settings) = 'object')
);

-- Indexes for profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_settings ON profiles USING GIN (settings);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. MULLIGAN SESSIONS TABLE
-- =============================================

CREATE TABLE mulligan_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  deck_name TEXT,
  device TEXT, -- 'WEB', 'MOBILE', etc.
  client_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for mulligan_sessions
CREATE INDEX idx_mulligan_sessions_user_id ON mulligan_sessions(user_id);
CREATE INDEX idx_mulligan_sessions_started_at ON mulligan_sessions(started_at);
CREATE INDEX idx_mulligan_sessions_created_at ON mulligan_sessions(created_at);

-- RLS Policies for mulligan_sessions
ALTER TABLE mulligan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON mulligan_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON mulligan_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON mulligan_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON mulligan_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. MULLIGAN EVENTS TABLE
-- =============================================

CREATE TABLE mulligan_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES mulligan_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'START_HAND', 'MULLIGAN', 'NEW_HAND', 'END_SESSION'
  hand_size INTEGER,
  kept_cards TEXT[], -- Array of card names kept
  mulliganed_cards TEXT[], -- Array of card names mulliganed away
  duration_ms INTEGER, -- How long this event took
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT mulligan_events_type_valid CHECK (type IN ('START_HAND', 'MULLIGAN', 'NEW_HAND', 'END_SESSION')),
  CONSTRAINT mulligan_events_hand_size_valid CHECK (hand_size >= 0 AND hand_size <= 20),
  CONSTRAINT mulligan_events_duration_valid CHECK (duration_ms >= 0)
);

-- Indexes for mulligan_events
CREATE INDEX idx_mulligan_events_session_id ON mulligan_events(session_id);
CREATE INDEX idx_mulligan_events_user_id ON mulligan_events(user_id);
CREATE INDEX idx_mulligan_events_type ON mulligan_events(type);
CREATE INDEX idx_mulligan_events_created_at ON mulligan_events(created_at);

-- RLS Policies for mulligan_events
ALTER TABLE mulligan_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events" ON mulligan_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON mulligan_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON mulligan_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON mulligan_events
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. RPC FUNCTIONS
-- =============================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION fn_user_stats(uid UUID)
RETURNS TABLE(
  total_sessions BIGINT,
  total_events BIGINT,
  total_duration_ms BIGINT,
  avg_session_duration_ms NUMERIC,
  first_session_date TIMESTAMP WITH TIME ZONE,
  last_session_date TIMESTAMP WITH TIME ZONE,
  sessions_this_week BIGINT,
  sessions_this_month BIGINT
)
LANGUAGE SQL
SECURITY INVOKER
AS $$
  WITH session_stats AS (
    SELECT
      COUNT(*) as session_count,
      COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000), 0) as total_duration,
      MIN(started_at) as first_session,
      MAX(started_at) as last_session,
      COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '7 days') as week_count,
      COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '30 days') as month_count
    FROM mulligan_sessions
    WHERE user_id = uid AND ended_at IS NOT NULL
  ),
  event_stats AS (
    SELECT COUNT(*) as event_count
    FROM mulligan_events
    WHERE user_id = uid
  )
  SELECT
    session_stats.session_count,
    event_stats.event_count,
    session_stats.total_duration::BIGINT,
    CASE
      WHEN session_stats.session_count > 0 THEN session_stats.total_duration / session_stats.session_count
      ELSE 0
    END,
    session_stats.first_session,
    session_stats.last_session,
    session_stats.week_count,
    session_stats.month_count
  FROM session_stats, event_stats;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fn_user_stats(UUID) TO authenticated;

-- Function to get user settings safely
CREATE OR REPLACE FUNCTION get_user_setting(
  user_uuid UUID,
  setting_path TEXT,
  default_value JSONB DEFAULT 'false'::jsonb
) RETURNS JSONB
LANGUAGE SQL
SECURITY INVOKER
AS $$
  SELECT COALESCE(
    settings #> string_to_array(setting_path, '.'),
    default_value
  )
  FROM profiles
  WHERE id = user_uuid;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_setting(UUID, TEXT, JSONB) TO authenticated;

-- Function to update user settings safely
CREATE OR REPLACE FUNCTION update_user_setting(
  user_uuid UUID,
  setting_path TEXT,
  new_value JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  update_count INTEGER;
BEGIN
  UPDATE profiles
  SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    string_to_array(setting_path, '.'),
    new_value,
    true
  ),
  updated_at = NOW()
  WHERE id = user_uuid
    AND id = auth.uid(); -- RLS: Users can only update their own settings

  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN update_count > 0;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_setting(UUID, TEXT, JSONB) TO authenticated;

-- =============================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. INITIAL DATA
-- =============================================

-- Set default settings for existing profiles (if any)
UPDATE profiles
SET settings = '{
  "saveDetailedHandData": false,
  "theme": "light",
  "notifications": {
    "email": true,
    "browser": false
  },
  "privacy": {
    "shareStats": false,
    "publicProfile": false
  }
}'::jsonb
WHERE settings = '{}'::jsonb OR settings IS NULL;

-- =============================================
-- Schema creation complete!
-- =============================================