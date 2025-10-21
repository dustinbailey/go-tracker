import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role key on the server side if available, otherwise use anon key
// This allows server-side operations to bypass RLS while client-side operations remain restricted
const supabaseKey = typeof window === 'undefined' && supabaseServiceKey 
  ? supabaseServiceKey 
  : supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 