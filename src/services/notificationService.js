import { supabase } from '../supabase';

export const notificationService = {
  // Create a new notification
  async createNotification(userId, title, message, type = 'info', appointmentId = null, appointmentTable = null) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type,
          appointment_id: appointmentId,
          appointment_table: appointmentTable
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get user notifications
  async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId, onNotification) {
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('New notification received:', payload);
          onNotification(payload);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Notification updated:', payload);
          onNotification(payload);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Notification deleted:', payload);
          onNotification(payload);
        }
      )
      .subscribe();

    return subscription;
  },

  // Create appointment status notification (for manual use)
  async createAppointmentStatusNotification(userId, appointmentId, appointmentTable, status, appointmentData = null) {
    let title, message, type;

    // Get service information from appointment data if available
    const serviceName = appointmentData?.service || 'Service Application';
    const appointmentDate = appointmentData?.appointment_date ? 
      new Date(appointmentData.appointment_date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'Not scheduled';
    const appointmentTime = appointmentData?.appointment_time ? 
      new Date(`2000-01-01T${appointmentData.appointment_time}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : '';
    const appointmentNote = appointmentData?.appointment_notes || '';

    switch (status) {
      case 'approved':
        title = 'Appointment Approved';
        if (appointmentData?.appointment_date && appointmentData?.appointment_time) {
          message = `Your appointment for ${serviceName} is approved and scheduled at ${appointmentDate} at ${appointmentTime}.`;
        } else {
          message = `Your appointment for ${serviceName} has been approved! Please check your appointment details for more information.`;
        }
        if (appointmentNote) {
          message += ` *Note: ${appointmentNote}`;
        }
        type = 'success';
        break;
      case 'declined':
        title = 'Appointment Declined';
        message = `Your appointment for ${serviceName} has been declined. Please contact us for more information.`;
        if (appointmentNote) {
          message += ` *Note: ${appointmentNote}`;
        }
        type = 'error';
        break;
      case 'cancelled':
        title = 'Appointment Cancelled';
        message = `Your appointment for ${serviceName} has been cancelled.`;
        if (appointmentNote) {
          message += ` *Note: ${appointmentNote}`;
        }
        type = 'warning';
        break;
      case 'scheduled':
        title = 'Appointment Scheduled';
        message = `Your appointment for ${serviceName} is scheduled at ${appointmentDate} at ${appointmentTime}.`;
        if (appointmentNote) {
          message += ` *Note: ${appointmentNote}`;
        }
        type = 'info';
        break;
      default:
        // No notification for generic status updates
        return null;
    }

    return await this.createNotification(userId, title, message, type, appointmentId, appointmentTable);
  },

  // Helper function to get service type name
  getServiceTypeName(tableName) {
    const serviceTypes = {
      'pwd': 'PWD Services',
      'senior_citizens': 'Senior Citizen Services',
      'solo_parents': 'Solo Parent Services',
      'financial_assistance': 'Financial Assistance',
      'early_childhood': 'Early Childhood Care',
      'youth_sector': 'Youth Sector',
      'womens_sector': 'Women\'s Sector'
    };
    return serviceTypes[tableName] || 'Service';
  }
};

export default notificationService;

