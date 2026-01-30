# Real-Time Notification System

This document describes the notification system implemented for the eSVMWDO application.

## Features

- **Real-time notifications** using Supabase real-time subscriptions
- **Appointment status updates** automatically trigger notifications
- **Notification bell icon** with unread count badge
- **Notification modal** with full notification management
- **Mobile responsive** design
- **Database triggers** for automatic notification creation

## Components

### 1. Database Schema

The notification system uses a `notifications` table with the following structure:

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  is_read BOOLEAN DEFAULT FALSE,
  appointment_id TEXT, -- Reference to appointment (table_name:id)
  appointment_table TEXT, -- Table name where appointment is stored
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Database Triggers

Automatic notifications are created when appointment status changes:

- **Approved**: Green success notification
- **Declined**: Red error notification  
- **Cancelled**: Yellow warning notification
- **Other status changes**: Blue info notification

### 3. Frontend Components

#### Notification Bell
- Located next to the profile button in the navbar
- Shows unread count badge (red circle with number)
- Different icons for read/unread states
- Available on both desktop and mobile

#### Notification Modal
- Displays all user notifications
- Real-time updates via Supabase subscriptions
- Mark individual notifications as read
- Mark all notifications as read
- Delete individual notifications
- Responsive design for mobile and desktop

### 4. Real-time Features

The system uses Supabase real-time subscriptions to:
- Receive new notifications instantly
- Update notification status in real-time
- Remove deleted notifications immediately
- Sync across multiple browser tabs

## Usage

### For Users

1. **View Notifications**: Click the notification bell icon
2. **Mark as Read**: Click "Mark read" on individual notifications
3. **Mark All as Read**: Click "Mark all as read" button
4. **Delete Notifications**: Click "Delete" on individual notifications

### For Developers

#### Creating Notifications Programmatically

```javascript
import { notificationService } from './services/notificationService';

// Create a custom notification
await notificationService.createNotification(
  userId,
  'Custom Title',
  'Custom message content',
  'info', // type: 'info', 'success', 'warning', 'error'
  appointmentId, // optional
  appointmentTable // optional
);

// Create appointment status notification
await notificationService.createAppointmentStatusNotification(
  userId,
  appointmentId,
  appointmentTable,
  'approved' // status
);
```

#### Subscribing to Real-time Updates

```javascript
const subscription = notificationService.subscribeToNotifications(
  userId,
  (payload) => {
    // Handle real-time notification updates
    console.log('Notification update:', payload);
  }
);

// Unsubscribe when done
subscription.unsubscribe();
```

## Database Setup

To set up the notification system, run the SQL commands in `database-schema.sql`:

1. Create the notifications table
2. Set up indexes for performance
3. Enable Row Level Security (RLS)
4. Create notification functions
5. Set up triggers for all appointment tables

## Security

- **Row Level Security (RLS)** ensures users can only see their own notifications
- **User authentication** required for all notification operations
- **Input validation** on all notification data

## Performance Considerations

- **Indexes** on frequently queried columns (user_id, is_read, created_at)
- **Real-time subscriptions** are filtered by user_id for efficiency
- **Pagination** can be added for users with many notifications
- **Cleanup** of old notifications can be implemented

## Future Enhancements

- **Email notifications** for important updates
- **Push notifications** for mobile devices
- **Notification preferences** for different types of updates
- **Bulk operations** for managing multiple notifications
- **Notification history** and analytics
- **Custom notification sounds** and visual effects

## Troubleshooting

### Common Issues

1. **Notifications not appearing**: Check if RLS policies are correctly set up
2. **Real-time not working**: Verify Supabase real-time is enabled
3. **Triggers not firing**: Ensure appointment tables have user_id column
4. **Permission errors**: Check user authentication and RLS policies

### Debug Mode

Enable console logging to debug notification issues:

```javascript
// In browser console
localStorage.setItem('debug', 'notifications');
```

This will show detailed logs of notification operations and real-time updates.

