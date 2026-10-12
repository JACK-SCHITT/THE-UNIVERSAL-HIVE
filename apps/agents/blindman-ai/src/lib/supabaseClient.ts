import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || (typeof location!=="undefined"?location.origin:"")) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "hive-anon-key") as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
