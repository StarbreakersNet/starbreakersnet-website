import { createClient } from "@supabase/supabase-js";

// Variables nommées comme dans le guide officiel Supabase pour Vue
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
