import { createClient } from "@supabase/supabase-js";


const SUPABASE_URL = "https://eshktejqytwxwnpnimvq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGt0ZWpxeXR3eHducG5pbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTAxODgsImV4cCI6MjA1ODI2NjE4OH0.ILVbcWegUe4Ka1LdyObZ2J1edSJKMaRw7_AWUm68G5A";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});