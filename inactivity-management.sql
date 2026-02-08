-- Inactivity Management System for User Management
-- Run this in your Supabase SQL editor

-- Enable pg_cron extension (if not already enabled)
-- Note: This may require superuser privileges. If pg_cron is not available,
-- you can use Supabase Edge Functions with a scheduled trigger instead.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add last_active timestamp column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- Create user_activity_logs table for tracking archival and deletion actions
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL, -- 'archived', 'deleted'
<<<<<<< HEAD
  reason TEXT NOT NULL, -- 'inactive_200_days', 'inactive_200_plus_days'
=======
  reason TEXT NOT NULL, -- 'inactive_20_days', 'inactive_200_days'
>>>>>>> dc4d4bf (update message)
  days_inactive INTEGER NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Store additional information like previous status, etc.
);

-- Create indexes for user_activity_logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_executed_at ON user_activity_logs(executed_at);

-- Create function to update user's last_active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET last_active = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manage inactive users
<<<<<<< HEAD
-- This function archives users inactive for 200 days and deletes users inactive for 200+ days.
-- Staff and admin roles are excluded from inactivity management (never archived or deleted).
=======
-- This function archives users inactive for 20 days and deletes citizen users inactive for 200+ days
-- Admin and staff users are excluded from deletion
>>>>>>> dc4d4bf (update message)
CREATE OR REPLACE FUNCTION manage_inactive_users()
RETURNS TABLE (
  archived_count INTEGER,
  deleted_count INTEGER,
  archived_users UUID[],
  deleted_users UUID[]
) AS $$
DECLARE
  v_archived_count INTEGER := 0;
  v_deleted_count INTEGER := 0;
  v_archived_users UUID[] := ARRAY[]::UUID[];
  v_deleted_users UUID[] := ARRAY[]::UUID[];
  v_user_record RECORD;
  v_user_email TEXT;
  v_user_name TEXT;
  v_days_inactive INTEGER;
BEGIN
  -- Archive users inactive for 200 days (but not yet 210 days)
  -- Only archive users that are not already archived. Exclude staff and admin.
  FOR v_user_record IN
    SELECT 
      id,
      email,
      full_name,
      EXTRACT(EPOCH FROM (NOW() - COALESCE(last_active, created_at))) / 86400 AS days_inactive
    FROM profiles
    WHERE archived = FALSE
      AND last_active IS NOT NULL
      AND last_active < NOW() - INTERVAL '200 days'
      AND last_active >= NOW() - INTERVAL '210 days'
      AND COALESCE(role, '') NOT IN ('staff', 'admin')
  LOOP
    -- Update user status to archived
    UPDATE profiles
    SET archived = TRUE
    WHERE id = v_user_record.id;
    
    -- Log the archival action
    INSERT INTO user_activity_logs (user_id, user_email, user_name, action, reason, days_inactive)
    VALUES (
      v_user_record.id,
      v_user_record.email,
      v_user_record.full_name,
      'archived',
      'inactive_200_days',
      FLOOR(v_user_record.days_inactive)::INTEGER
    );
    
    v_archived_count := v_archived_count + 1;
    v_archived_users := array_append(v_archived_users, v_user_record.id);
  END LOOP;
  
<<<<<<< HEAD
  -- Delete users inactive for 210+ days (already archived from 200-day threshold)
  -- Only delete users that are already archived (safety check). Exclude staff and admin.
=======
  -- Delete users inactive for 200+ days
  -- Only delete users that are already archived (safety check)
  -- Only delete citizen accounts (role = 'user'), exclude admin and staff
>>>>>>> dc4d4bf (update message)
  FOR v_user_record IN
    SELECT 
      id,
      email,
      full_name,
      EXTRACT(EPOCH FROM (NOW() - COALESCE(last_active, created_at))) / 86400 AS days_inactive
    FROM profiles
    WHERE archived = TRUE
      AND last_active IS NOT NULL
<<<<<<< HEAD
      AND last_active < NOW() - INTERVAL '210 days'
      AND COALESCE(role, '') NOT IN ('staff', 'admin')
=======
      AND last_active < NOW() - INTERVAL '200 days'
      AND role = 'user'  -- Only delete citizen accounts, exclude admin and staff
>>>>>>> dc4d4bf (update message)
  LOOP
    -- Log the deletion action before deleting
    INSERT INTO user_activity_logs (user_id, user_email, user_name, action, reason, days_inactive)
    VALUES (
      v_user_record.id,
      v_user_record.email,
      v_user_record.full_name,
      'deleted',
<<<<<<< HEAD
      'inactive_200_plus_days',
=======
      'inactive_200_days',
>>>>>>> dc4d4bf (update message)
      FLOOR(v_user_record.days_inactive)::INTEGER
    );
    
    -- Delete the user from auth.users (if exists)
    -- Note: This requires appropriate permissions. You may need to handle this via Supabase Admin API
    -- For now, we'll just delete from profiles table
    DELETE FROM profiles WHERE id = v_user_record.id;
    
    v_deleted_count := v_deleted_count + 1;
    v_deleted_users := array_append(v_deleted_users, v_user_record.id);
  END LOOP;
  
<<<<<<< HEAD
  -- Also handle users with NULL last_active that are older than 210 days
  -- These are users who never had their activity tracked. Exclude staff and admin.
=======
  -- Also handle users with NULL last_active that are older than 200 days
  -- These are users who never had their activity tracked
  -- Only delete citizen accounts (role = 'user'), exclude admin and staff
>>>>>>> dc4d4bf (update message)
  FOR v_user_record IN
    SELECT 
      id,
      email,
      full_name,
      EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS days_inactive
    FROM profiles
    WHERE archived = TRUE
      AND last_active IS NULL
<<<<<<< HEAD
      AND created_at < NOW() - INTERVAL '210 days'
      AND COALESCE(role, '') NOT IN ('staff', 'admin')
=======
      AND created_at < NOW() - INTERVAL '200 days'
      AND role = 'user'  -- Only delete citizen accounts, exclude admin and staff
>>>>>>> dc4d4bf (update message)
  LOOP
    -- Log the deletion action
    INSERT INTO user_activity_logs (user_id, user_email, user_name, action, reason, days_inactive)
    VALUES (
      v_user_record.id,
      v_user_record.email,
      v_user_record.full_name,
      'deleted',
<<<<<<< HEAD
      'inactive_200_plus_days_no_activity',
=======
      'inactive_200_days_no_activity',
>>>>>>> dc4d4bf (update message)
      FLOOR(v_user_record.days_inactive)::INTEGER
    );
    
    -- Delete the user
    DELETE FROM profiles WHERE id = v_user_record.id;
    
    v_deleted_count := v_deleted_count + 1;
    v_deleted_users := array_append(v_deleted_users, v_user_record.id);
  END LOOP;
  
  RETURN QUERY SELECT v_archived_count, v_deleted_count, v_archived_users, v_deleted_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run the inactivity management function daily at 2 AM UTC
-- Note: pg_cron may require superuser privileges. If unavailable, use Supabase Edge Functions instead.
-- To use pg_cron, run this command (requires superuser):
SELECT cron.schedule(
  'manage-inactive-users-daily',
  '0 2 * * *', -- Run daily at 2 AM UTC
  $$SELECT manage_inactive_users()$$
);

-- Alternative: If pg_cron is not available, you can manually trigger the function:
-- SELECT * FROM manage_inactive_users();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_last_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manage_inactive_users() TO service_role;

-- Create a view to see inactive users summary
CREATE OR REPLACE VIEW inactive_users_summary AS
SELECT 
  id,
  email,
  full_name,
  role,
  archived,
  last_active,
  created_at,
  CASE 
    WHEN last_active IS NULL THEN EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400
    ELSE EXTRACT(EPOCH FROM (NOW() - last_active)) / 86400
  END AS days_inactive,
  CASE
    WHEN last_active IS NULL THEN 'never_active'
    WHEN last_active < NOW() - INTERVAL '200 days' THEN 'over_200_days'
<<<<<<< HEAD
=======
    WHEN last_active < NOW() - INTERVAL '20 days' THEN 'over_20_days'
>>>>>>> dc4d4bf (update message)
    ELSE 'active'
  END AS inactivity_status
FROM profiles
ORDER BY 
  CASE 
    WHEN last_active IS NULL THEN created_at
    ELSE last_active
  END ASC;

-- Grant select on the view
GRANT SELECT ON inactive_users_summary TO authenticated;

