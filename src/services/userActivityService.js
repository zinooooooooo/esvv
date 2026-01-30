/**
 * User Activity Service
 * Handles tracking and updating user activity timestamps
 */

import { supabase } from '../supabase';

/**
 * Update the last_active timestamp for the current user
 * Call this function whenever the user performs an action
 */
export const updateUserActivity = async (userId) => {
  if (!userId) {
    console.warn('updateUserActivity: No userId provided');
    return;
  }

  try {
    const { error } = await supabase.rpc('update_user_last_active', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error updating user activity:', error);
      // Fallback: try direct update if RPC fails
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user activity (fallback):', updateError);
      }
    }
  } catch (error) {
    console.error('Exception updating user activity:', error);
  }
};

/**
 * Get user's last active timestamp
 */
export const getUserLastActive = async (userId) => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('last_active')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user last active:', error);
      return null;
    }

    return data?.last_active || null;
  } catch (error) {
    console.error('Exception fetching user last active:', error);
    return null;
  }
};

/**
 * Get inactivity logs for a user
 */
export const getUserActivityLogs = async (userId, limit = 10) => {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user activity logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching user activity logs:', error);
    return [];
  }
};

/**
 * Get all activity logs (admin only)
 */
export const getAllActivityLogs = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching activity logs:', error);
    return [];
  }
};

/**
 * Manually trigger inactivity management (admin only)
 * Note: This should typically be handled by the scheduled job
 */
export const triggerInactivityManagement = async () => {
  try {
    const { data, error } = await supabase.rpc('manage_inactive_users');

    if (error) {
      console.error('Error triggering inactivity management:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception triggering inactivity management:', error);
    return null;
  }
};

