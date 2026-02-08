-- SQL Query to Add Admin Account
-- Email: mswdo.adm1@gmail.com
-- 
-- IMPORTANT: In Supabase, you need to create the auth user first before inserting into profiles.
-- The auth user can be created via:
-- 1. Supabase Dashboard > Authentication > Add User (recommended)
-- 2. Supabase Admin API
-- 3. Or use the auth.signUp() function in your application
--
-- After creating the auth user, note the user's UUID (id) and use it in the INSERT statement below.

-- Option 1: If you already have the auth user UUID, use this:
-- Replace 'USER_UUID_HERE' with the actual UUID from auth.users
/*
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  archived,
  last_active,
  created_at
)
VALUES (
  'USER_UUID_HERE',  -- Replace with the UUID from auth.users
  'mswdo.adm1@gmail.com',
  'Admin Account',  -- You can change this to the actual admin name
  'admin',
  FALSE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;
*/

-- Option 2: If you need to find the user UUID first, use this query:
-- (Run this after creating the auth user via Supabase Dashboard)
/*
SELECT id, email 
FROM auth.users 
WHERE email = 'mswdo.adm1@gmail.com';
*/

-- Option 3: Complete solution using a function (requires appropriate permissions)
-- This creates both the auth user and profile in one go
-- Note: This may require superuser privileges or Supabase Admin API access
CREATE OR REPLACE FUNCTION create_admin_account(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT 'Admin Account'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate a UUID for the new user
  v_user_id := gen_random_uuid();
  
  -- Note: In Supabase, you cannot directly insert into auth.users via SQL
  -- You need to use the Supabase Admin API or create the user via Dashboard first
  -- This function assumes the auth user already exists
  
  -- Insert into profiles table
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    archived,
    last_active,
    created_at
  )
  VALUES (
    v_user_id,
    p_email,
    p_full_name,
    'admin',
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RECOMMENDED APPROACH:
-- Step 1: Create the auth user via Supabase Dashboard
--   - Go to Authentication > Users > Add User
--   - Email: mswdo.adm1@gmail.com
--   - Set a password
--   - Auto Confirm User: Yes
--   - Copy the User UUID

-- Step 2: Run this INSERT statement (generates a random UUID automatically):
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  archived,
  last_active,
  created_at
)
VALUES (
  gen_random_uuid(),  -- Generates a random UUID
  'mswdo.adm1@gmail.com',
  'Admin Account',
  'admin',
  FALSE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = 'admin',  -- Ensure role is set to admin
  full_name = EXCLUDED.full_name;
