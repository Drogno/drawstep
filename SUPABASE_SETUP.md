# Supabase Setup Instructions

## Problem & Solution

**Error**: `relation "profiles" does not exist` OR `must be owner of table users`

**Cause**:
- The old migration file tried to modify a `profiles` table that doesn't exist yet
- OR trying to modify the `auth.users` table which is owned by Supabase

**Solution**: Use the complete initial schema instead.

## Correct Setup Steps

### 1. Clean Start (if you've run partial migrations)

If you've already tried running the old migration, reset your database:

1. Go to Supabase Dashboard → Settings → Database
2. Scroll down to "Danger Zone"
3. Click "Reset database" (this will delete all data!)
4. Confirm the reset

### 2. Run the Complete Schema

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `migrations/00_initial_schema.sql`
4. Click "Run" or press Ctrl+Enter

### 3. Verify Tables Were Created

Check that these tables exist in your Database → Tables view:
- `profiles`
- `mulligan_sessions`
- `mulligan_events`

### 4. Test RLS Policies

The schema includes Row Level Security (RLS) policies. Test that they work:

1. Create a test user through your app's registration
2. Check that the user can only see their own data
3. Verify that direct database access is restricted

### 5. Generate TypeScript Types

#### Find Your Project Reference First:
1. Go to Supabase Dashboard
2. Open your project
3. Look at the URL: `https://supabase.com/dashboard/project/ABC123DEF456`
4. Copy the part after `/project/` (e.g., `ABC123DEF456`)

#### Create Types Directory:
```bash
mkdir types
```

#### Generate Types:
```bash
# Replace ABC123DEF456 with your actual project ref
supabase gen types typescript --project-id ABC123DEF456 > types/supabase.ts

# Example if your project ref is "xyzabc123456":
supabase gen types typescript --project-id xyzabc123456 > types/supabase.ts
```

#### Verify It Worked:
```bash
# Windows - check file was created
type types\supabase.ts

# Should show TypeScript interfaces for your tables
```

## What the Schema Creates

### Tables
- **profiles**: User profiles with settings and consent tracking
- **mulligan_sessions**: Training session records
- **mulligan_events**: Detailed event tracking within sessions

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensuring users can only access their own data
- Secure functions for settings management

### Functions
- `fn_user_stats(uid)`: Calculate user statistics
- `get_user_setting(uid, path, default)`: Safe settings access
- `update_user_setting(uid, path, value)`: Safe settings updates

### Features
- Automatic `updated_at` timestamps
- JSONB settings with validation
- Telemetry consent tracking
- Performance indexes

## If You Still Get Errors

### "Permission denied for table profiles"
- Check that RLS policies are enabled
- Verify you're authenticated when testing
- Make sure your user ID matches the policy conditions

### "Function does not exist"
- Re-run the complete schema
- Check function permissions in Database → Functions

### "Settings validation failed"
- Settings must be valid JSON objects
- Use the provided helper functions for updates

## Next Steps

After successful schema creation:

1. Set up your `.env.local` file
2. Generate TypeScript types
3. Test authentication flow
4. Verify data collection works
5. Test privacy features (export/delete)

## Schema Files Explanation

- `migrations/00_initial_schema.sql` - Complete database setup (USE THIS)
- `migrations/add_profile_settings.sql` - Old incomplete migration (IGNORE THIS)

Always use the `00_initial_schema.sql` file for new projects!