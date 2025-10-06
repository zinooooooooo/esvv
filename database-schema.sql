-- Document Management System Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  editable BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_starred ON documents(starred);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_folders_updated_at 
  BEFORE UPDATE ON folders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default folders
INSERT INTO folders (name, editable, is_default) VALUES
  ('All Documents', false, true),
  ('Starred', false, true),
  ('General', true, true)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for folders (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on folders" ON folders
  FOR ALL USING (true);

-- Create policies for documents (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL USING (true);

-- Create staff_members table
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  location TEXT,
  hierarchy TEXT NOT NULL,
  hierarchy_order INTEGER NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for staff_members
CREATE INDEX IF NOT EXISTS idx_staff_members_hierarchy ON staff_members(hierarchy);
CREATE INDEX IF NOT EXISTS idx_staff_members_hierarchy_order ON staff_members(hierarchy_order);
CREATE INDEX IF NOT EXISTS idx_staff_members_name ON staff_members(name);

-- Create trigger for staff_members updated_at
CREATE TRIGGER update_staff_members_updated_at 
  BEFORE UPDATE ON staff_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for staff_members (for easier management)
-- ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_members (commented out since RLS is disabled)
-- Allow public read access
-- CREATE POLICY "Allow public read access to staff_members" ON staff_members
--   FOR SELECT USING (true);

-- Allow authenticated users to insert, update, delete
-- CREATE POLICY "Allow authenticated users to manage staff_members" ON staff_members
--   FOR ALL USING (auth.uid() IS NOT NULL);

-- Create storage bucket for documents
-- Note: This needs to be done in the Supabase dashboard under Storage
-- Bucket name: 'documents'
-- Public bucket: true
-- File size limit: 50MB
-- Allowed MIME types: 
--   application/pdf
--   application/msword
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document
--   application/vnd.ms-excel
--   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
--   application/vnd.ms-powerpoint
--   application/vnd.openxmlformats-officedocument.presentationml.presentation
--   text/plain
--   image/jpeg
--   image/png
--   image/gif
--   video/mp4
--   video/avi
--   video/quicktime

-- Create storage bucket for staff photos
-- Note: This needs to be done in the Supabase dashboard under Storage
-- Bucket name: 'staff_photos'
-- Public bucket: true
-- File size limit: 5MB
-- Allowed MIME types: 
--   image/jpeg
--   image/png
--   image/webp

-- Storage policies (run these after creating the bucket)
-- CREATE POLICY "Allow public access to documents" ON storage.objects
--   FOR SELECT USING (bucket_id = 'documents');

-- CREATE POLICY "Allow authenticated uploads to documents" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated deletes from documents" ON storage.objects
--   FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Storage policies for staff_photos (run these after creating the bucket)
-- CREATE POLICY "Allow public access to staff_photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'staff_photos');

-- CREATE POLICY "Allow authenticated uploads to staff_photos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'staff_photos' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated deletes from staff_photos" ON storage.objects
--   FOR DELETE USING (bucket_id = 'staff_photos' AND auth.role() = 'authenticated');

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create trigger for notifications updated_at
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_appointment_id TEXT DEFAULT NULL,
  p_appointment_table TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, appointment_id, appointment_table)
  VALUES (p_user_id, p_title, p_message, p_type, p_appointment_id, p_appointment_table)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  is_read BOOLEAN,
  appointment_id TEXT,
  appointment_table TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.appointment_id,
    n.appointment_table,
    n.created_at
  FROM notifications n
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add archived field to profiles table (if it doesn't exist)
-- This should be run in Supabase SQL editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_archived ON profiles(archived);

-- Add personal details and ID verification fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS barangay TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS front_id_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS back_id_url TEXT;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_barangay ON profiles(barangay);
CREATE INDEX IF NOT EXISTS idx_profiles_id_type ON profiles(id_type);
CREATE INDEX IF NOT EXISTS idx_profiles_id_number ON profiles(id_number);

-- Create function to create appointment status notification
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val UUID;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  appointment_table_name TEXT;
  service_name TEXT;
  service_type TEXT;
  appointment_date_formatted TEXT;
  appointment_time_formatted TEXT;
  appointment_note TEXT;
BEGIN
  -- Get the user_id from the appointment record
  user_id_val := NEW.user_id;
  
  -- Determine notification details based on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    appointment_table_name := TG_TABLE_NAME;
    
    -- Get service information
    service_name := COALESCE(NEW.service, 'Service Application');
    service_type := CASE appointment_table_name
      WHEN 'pwd' THEN 'PWD Services'
      WHEN 'senior_citizens' THEN 'Senior Citizen Services'
      WHEN 'solo_parents' THEN 'Solo Parent Services'
      WHEN 'financial_assistance' THEN 'Financial Assistance'
      WHEN 'early_childhood' THEN 'Early Childhood Care'
      WHEN 'youth_sector' THEN 'Youth Sector'
      WHEN 'womens_sector' THEN 'Women''s Sector'
      ELSE 'Service'
    END;
    
    -- Format appointment date and time
    IF NEW.appointment_date IS NOT NULL THEN
      appointment_date_formatted := TO_CHAR(NEW.appointment_date, 'Mon DD, YYYY');
    ELSE
      appointment_date_formatted := 'Not scheduled';
    END IF;
    
    IF NEW.appointment_time IS NOT NULL THEN
      appointment_time_formatted := TO_CHAR(NEW.appointment_time::TIME, 'HH12:MI AM');
    ELSE
      appointment_time_formatted := '';
    END IF;
    
    -- Get appointment note if available
    appointment_note := COALESCE(NEW.appointment_notes, '');
    
    -- Set notification content based on new status
    CASE NEW.status
      WHEN 'approved' THEN
        notification_title := 'Appointment Approved';
        IF NEW.appointment_date IS NOT NULL AND NEW.appointment_time IS NOT NULL THEN
          notification_message := 'Your appointment for ' || service_name || ' is approved and scheduled at ' || appointment_date_formatted || ' at ' || appointment_time_formatted || '.';
        ELSE
          notification_message := 'Your appointment for ' || service_name || ' has been approved! Please check your appointment details for more information.';
        END IF;
        IF appointment_note != '' THEN
          notification_message := notification_message || ' *Note: ' || appointment_note;
        END IF;
        notification_type := 'success';
      WHEN 'declined' THEN
        notification_title := 'Appointment Declined';
        notification_message := 'Your appointment for ' || service_name || ' has been declined. Please contact us for more information.';
        IF appointment_note != '' THEN
          notification_message := notification_message || ' *Note: ' || appointment_note;
        END IF;
        notification_type := 'error';
      WHEN 'cancelled' THEN
        notification_title := 'Appointment Cancelled';
        notification_message := 'Your appointment for ' || service_name || ' has been cancelled.';
        IF appointment_note != '' THEN
          notification_message := notification_message || ' *Note: ' || appointment_note;
        END IF;
        notification_type := 'warning';
      WHEN 'scheduled' THEN
        notification_title := 'Appointment Scheduled';
        notification_message := 'Your appointment for ' || service_name || ' is scheduled at ' || appointment_date_formatted || ' at ' || appointment_time_formatted || '.';
        IF appointment_note != '' THEN
          notification_message := notification_message || ' *Note: ' || appointment_note;
        END IF;
        notification_type := 'info';
      ELSE
        -- No notification for generic status updates
        RETURN NEW;
    END CASE;
    
    -- Create the notification
    INSERT INTO notifications (user_id, title, message, type, appointment_id, appointment_table)
    VALUES (
      user_id_val,
      notification_title,
      notification_message,
      notification_type,
      NEW.id::TEXT,
      appointment_table_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all appointment tables
-- Note: You'll need to run these for each appointment table in your system

-- PWD table trigger
CREATE TRIGGER pwd_notification_trigger
  AFTER UPDATE ON pwd
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();

-- Senior Citizens table trigger
CREATE TRIGGER senior_citizens_notification_trigger
  AFTER UPDATE ON senior_citizens
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();

-- Solo Parents table trigger
CREATE TRIGGER solo_parents_notification_trigger
  AFTER UPDATE ON solo_parents
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();

-- Financial Assistance table trigger
CREATE TRIGGER financial_assistance_notification_trigger
  AFTER UPDATE ON financial_assistance
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();

-- Early Childhood table trigger
CREATE TRIGGER early_childhood_notification_trigger
  AFTER UPDATE ON early_childhood
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();

-- Youth Sector table trigger
CREATE TRIGGER youth_sector_notification_trigger
  AFTER UPDATE ON youth_sector
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();

-- Women's Sector table trigger
CREATE TRIGGER womens_sector_notification_trigger
  AFTER UPDATE ON womens_sector
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();
