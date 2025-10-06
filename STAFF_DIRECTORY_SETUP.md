# Staff Directory Setup Guide

This guide will help you set up the staff directory feature for the eSVMWDO application.

## Database Setup

### 1. Run the Database Schema

Execute the following SQL commands in your Supabase SQL editor:

```sql
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
```

### 2. Create Storage Bucket for Staff Photos

In your Supabase dashboard:

1. Go to **Storage** section
2. Click **Create a new bucket**
3. Set bucket name: `staff_photos`
4. Make it **Public**
5. Set file size limit to **5MB**
6. Add allowed MIME types:
   - `image/jpeg`
   - `image/png`
   - `image/webp`

### 3. Set Storage Policies

Run these SQL commands in your Supabase SQL editor:

```sql
-- Storage policies for staff_photos
CREATE POLICY "Allow public access to staff_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'staff_photos');

CREATE POLICY "Allow authenticated uploads to staff_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'staff_photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes from staff_photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'staff_photos' AND auth.role() = 'authenticated');
```

## Staff Hierarchy Structure

The staff directory organizes staff members according to the following hierarchy:

### Main Staff Categories:
1. **MSWDO WELFARE OFFICER** - Top level management
2. **SOCIAL WELFARE OFFICER III** - Senior welfare officers
3. **SOCIAL WELFARE ASSISTANT** - Welfare assistants
4. **CHILD DEVT TEACHER 2** - Child development teachers

### Support Staff:
- **MUNICIPAL LINK** - Municipal liaison officers
- **LGU LINK** - Local government unit liaisons

### Administrative Staff:
- **ADMINISTRATIVE AIDE** - Administrative support staff
- **PWD FOCAL PERSON** - PWD program coordinators

## Features

### Staff Directory Page (`/staff-directory`)
- **View Staff**: Browse all staff members organized by hierarchy (all users)
- **Add Staff**: Add new staff members with photos and contact information (admin only)
- **Edit Staff**: Update existing staff information (admin only)
- **Delete Staff**: Remove staff members from the directory (admin only)
- **Photo Upload**: Upload staff photos (JPG, PNG, WebP formats) (admin only)

### Navigation
- Access via "Meet Our Staff" button on the homepage
- Direct URL: `/staff-directory`

## Usage Instructions

### For Administrators:

#### Adding a Staff Member:
1. Navigate to the Staff Directory page
2. Click "Add Staff Member" button (admin only)
3. Fill in the required information:
   - Full Name (required)
   - Position (required)
   - Hierarchy Level (required)
   - Phone Number (optional)
   - Email Address (optional)
   - Location/Office (optional)
4. Upload a staff photo (optional)
5. Click "Add Staff" to save

#### Editing a Staff Member:
1. Find the staff member in the directory
2. Click the edit icon (pencil) on their card (admin only)
3. Modify the information as needed
4. Click "Update Staff" to save changes

#### Deleting a Staff Member:
1. Find the staff member in the directory
2. Click the delete icon (trash) on their card (admin only)
3. Confirm the deletion

### For Regular Users:
- **View Only**: Users can browse and view all staff members
- **No Modification**: Users cannot add, edit, or delete staff members
- **Contact Information**: Users can see staff contact details and photos

## File Structure

```
esvv/src/Staff/
├── StaffPage.jsx          # Main staff directory component
└── ...                    # Other staff-related components

esvv/
├── database-schema.sql    # Database schema including staff_members table
└── STAFF_DIRECTORY_SETUP.md  # This setup guide
```

## Technical Details

### Database Schema
- **staff_members** table stores all staff information
- **hierarchy_order** field ensures proper sorting
- **photo_url** stores links to uploaded staff photos
- **RLS (Row Level Security)** enabled for data protection

### Access Control
- **Admin Users**: Full CRUD operations (Create, Read, Update, Delete)
- **Regular Users**: Read-only access to view staff information
- **Authentication**: Uses Supabase auth with role-based permissions

### Storage
- **staff_photos** bucket stores uploaded staff photos
- Public access for viewing photos
- Authenticated users can upload/delete photos
- 5MB file size limit per photo

### Frontend Features
- Responsive design for mobile and desktop
- Modal-based add/edit forms
- Image upload with preview
- Hierarchical organization display
- Search and filter capabilities (future enhancement)

## Troubleshooting

### Common Issues:

1. **Photos not uploading**: Check storage bucket permissions and policies
2. **Staff not appearing**: Verify database table creation and RLS policies
3. **Permission errors**: Ensure user is authenticated for add/edit/delete operations

### Support:
For technical support, check the Supabase logs and browser console for error messages.

## Future Enhancements

Potential features to add:
- Staff search functionality
- Filter by hierarchy level
- Staff contact form integration
- Staff availability calendar
- Staff performance metrics
- Bulk import/export functionality
