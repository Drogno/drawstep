-- =============================================
-- Migration: Add settings column to profiles table
-- =============================================

-- Add settings JSONB column with default empty object
ALTER TABLE profiles
ADD COLUMN settings JSONB DEFAULT '{}';

-- Create index for settings queries (optional but recommended for performance)
CREATE INDEX idx_profiles_settings ON profiles USING GIN (settings);

-- Update existing profiles to have default settings
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

-- Add constraint to ensure settings is always valid JSON
ALTER TABLE profiles
ADD CONSTRAINT profiles_settings_valid_json
CHECK (settings IS NOT NULL AND jsonb_typeof(settings) = 'object');

-- Create helper function to get user settings safely
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

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION get_user_setting(UUID, TEXT, JSONB) TO authenticated;

-- Create helper function to update user settings safely
CREATE OR REPLACE FUNCTION update_user_setting(
  user_uuid UUID,
  setting_path TEXT,
  new_value JSONB
) RETURNS BOOLEAN
LANGUAGE SQL
SECURITY INVOKER
AS $$
  UPDATE profiles
  SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    string_to_array(setting_path, '.'),
    new_value,
    true
  )
  WHERE id = user_uuid
    AND id = auth.uid(); -- RLS: Users can only update their own settings

  SELECT FOUND;
$$;

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION update_user_setting(UUID, TEXT, JSONB) TO authenticated;

-- =============================================
-- Example usage:
--
-- Get setting:
-- SELECT get_user_setting(auth.uid(), 'saveDetailedHandData', 'false'::jsonb);
--
-- Update setting:
-- SELECT update_user_setting(auth.uid(), 'saveDetailedHandData', 'true'::jsonb);
--
-- Get nested setting:
-- SELECT get_user_setting(auth.uid(), 'notifications.email', 'true'::jsonb);
-- =============================================