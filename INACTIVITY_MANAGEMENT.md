# Inactivity Management System

This document describes the inactivity management system implemented for the eSVMWDO application. The system automatically archives users inactive for 200 days and deletes users inactive for 200+ days. **Staff and admin users are exempt** and are never archived or deleted for inactivity.

## Features

- **Automatic Activity Tracking**: Tracks user's last active timestamp on login and key actions
- **Automatic Archival**: Users inactive for 200 days are automatically archived (staff/admin exempt)
- **Automatic Deletion**: Users inactive for 200+ days are permanently deleted (staff/admin exempt)
- **Activity Logging**: All archival and deletion actions are logged with detailed information
- **Manual Trigger**: Admins can manually trigger inactivity management from the User Management page
- **Visual Indicators**: User Management page displays last active time and inactivity status

## Database Setup

### 1. Run the SQL Migration

Execute the SQL commands in `inactivity-management.sql` in your Supabase SQL editor:

```sql
-- This will:
-- 1. Add last_active column to profiles table
-- 2. Create user_activity_logs table for tracking actions
-- 3. Create functions for updating activity and managing inactive users
-- 4. Set up a scheduled job (pg_cron) to run daily
```

**Note**: If `pg_cron` extension is not available (requires superuser privileges), you can:
- Use Supabase Edge Functions with a scheduled trigger instead
- Manually trigger the function: `SELECT * FROM manage_inactive_users();`
- Set up an external cron job to call the function via API

### 2. Verify Setup

After running the migration, verify the setup:

```sql
-- Check if last_active column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'last_active';

-- Check if user_activity_logs table exists
SELECT * FROM user_activity_logs LIMIT 1;

-- Test the inactivity management function
SELECT * FROM manage_inactive_users();
```

## How It Works

### Activity Tracking

The system tracks user activity in the following scenarios:

1. **User Login**: When a user logs in, `last_active` is updated
2. **Session Restoration**: When a user's session is restored, `last_active` is updated
3. **Periodic Updates**: Every 5 minutes while the user is active, `last_active` is updated
4. **Key Actions**: When users fetch appointments or notifications, `last_active` is updated

### Inactivity Management Process

The `manage_inactive_users()` function runs daily (or manually) and:

1. **Archives Users (200 days inactive)**:
   - Finds users with `last_active` between 200–210 days ago (excluding staff and admin)
   - Sets `archived = TRUE`
   - Logs the action in `user_activity_logs`

2. **Deletes Users (200+ days inactive)**:
   - Finds archived users with `last_active` older than 200 days (excluding staff and admin)
   - Logs the deletion action
   - Permanently deletes the user from `profiles` table
   - **Note**: To delete from `auth.users`, you may need to use Supabase Admin API

3. **Exemptions**: Users with `role = 'staff'` or `role = 'admin'` are never archived or deleted for inactivity.

### Activity Logs

All archival and deletion actions are logged in the `user_activity_logs` table with:
- User ID, email, and name
- Action type (`archived` or `deleted`)
- Reason (`inactive_200_days`, `inactive_200_plus_days`, etc.)
- Days inactive
- Timestamp of execution
- Additional metadata (JSONB)

## Frontend Integration

### User Activity Service

The `userActivityService.js` provides functions to:
- `updateUserActivity(userId)`: Update user's last active timestamp
- `getUserLastActive(userId)`: Get user's last active timestamp
- `getUserActivityLogs(userId)`: Get activity logs for a user
- `getAllActivityLogs()`: Get all activity logs (admin only)
- `triggerInactivityManagement()`: Manually trigger inactivity management

### User Management Page

The User Management page (`UserManagement.jsx`) now includes:

1. **Last Active Column**: Shows when the user was last active
2. **Inactivity Status**: Color-coded status badges:
   - Gray (Exempt): Staff and admin—not subject to inactivity management
   - Green: Active (< 50 days)
   - Yellow: Over 50 days
   - Orange: Over 100 days
   - Red: Over 200 days (will be archived/deleted)
3. **Manual Trigger Button**: "Manage Inactive Users" button to manually run the process
4. **Result Display**: Shows results after running inactivity management

## Scheduled Job Setup

### Option 1: Using pg_cron (Recommended if available)

The SQL migration includes a pg_cron job that runs daily at 2 AM UTC:

```sql
SELECT cron.schedule(
  'manage-inactive-users-daily',
  '0 2 * * *', -- Run daily at 2 AM UTC
  $$SELECT manage_inactive_users()$$
);
```

### Option 2: Using Supabase Edge Functions

If pg_cron is not available, create a Supabase Edge Function:

1. Create a new Edge Function in Supabase Dashboard
2. Set up a scheduled trigger (cron job) to call the function
3. The function should call `manage_inactive_users()` via RPC

### Option 3: External Cron Job

Set up an external cron job (e.g., using a service like cron-job.org) that:
- Calls your Supabase API endpoint
- Triggers the `manage_inactive_users()` function

## Monitoring and Maintenance

### View Inactive Users Summary

Use the provided view to see inactive users:

```sql
SELECT * FROM inactive_users_summary
WHERE inactivity_status IN ('over_200_days')
ORDER BY days_inactive DESC;
```

### View Activity Logs

```sql
-- View recent activity logs
SELECT * FROM user_activity_logs
ORDER BY executed_at DESC
LIMIT 50;

-- View logs for a specific user
SELECT * FROM user_activity_logs
WHERE user_id = 'user-uuid-here'
ORDER BY executed_at DESC;
```

### Check Scheduled Job Status

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'manage-inactive-users-daily')
ORDER BY start_time DESC
LIMIT 10;
```

## Configuration

### Adjusting Time Thresholds

To change the archival/deletion thresholds, modify the function in `inactivity-management.sql`:

```sql
-- Change 200 days archival threshold
AND last_active < NOW() - INTERVAL '200 days'

-- Change 210 days deletion threshold
AND last_active < NOW() - INTERVAL '210 days'
```

### Adjusting Update Frequency

To change how often activity is updated in the frontend, modify `Navbar.jsx`:

```javascript
// Change from 5 minutes to 10 minutes
const activityInterval = setInterval(() => {
  updateUserActivity(user.id);
}, 10 * 60 * 1000); // 10 minutes
```

## Security Considerations

1. **Row Level Security**: Ensure proper RLS policies are set on `user_activity_logs`
2. **Function Permissions**: The `manage_inactive_users()` function uses `SECURITY DEFINER` to run with elevated privileges
3. **Audit Trail**: All actions are logged for audit purposes
4. **Soft Delete**: Consider implementing soft deletes if you need to recover deleted users

## Troubleshooting

### Users Not Being Archived/Deleted

1. Check if `last_active` is being updated:
   ```sql
   SELECT id, email, last_active, created_at 
   FROM profiles 
   WHERE archived = FALSE
   ORDER BY last_active ASC;
   ```

2. Verify the scheduled job is running:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'manage-inactive-users-daily')
   ORDER BY start_time DESC;
   ```

3. Manually test the function:
   ```sql
   SELECT * FROM manage_inactive_users();
   ```

### Activity Not Updating

1. Check browser console for errors
2. Verify the `update_user_last_active` function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'update_user_last_active';
   ```
3. Check network requests in browser DevTools

## API Reference

### Database Functions

#### `update_user_last_active(p_user_id UUID)`
Updates the `last_active` timestamp for a user.

#### `manage_inactive_users()`
Manages inactive users by archiving and deleting based on inactivity thresholds.

**Returns:**
- `archived_count`: Number of users archived
- `deleted_count`: Number of users deleted
- `archived_users`: Array of archived user IDs
- `deleted_users`: Array of deleted user IDs

## Support

For issues or questions, please refer to:
- Supabase Documentation: https://supabase.com/docs
- pg_cron Documentation: https://github.com/citusdata/pg_cron






