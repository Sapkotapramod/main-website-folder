import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://hkwjnzohrzydmdyigwjr.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd2puem9ocnp5ZG1keWlnd2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzUxMzUsImV4cCI6MjEwNTgxMTEzNX0.K4L4LrewJ_xHqsg2jCYE3H9AOMcDCqSBPuujM7ujH8k";
export const ADMIN_EMAIL = "pramodsapkota132@gmail.com";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
