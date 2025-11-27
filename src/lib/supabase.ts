import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// ⚠️ IMPORTANTE
// Para escritura desde backend siempre usar SERVICE ROLE
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
