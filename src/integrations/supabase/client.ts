import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pbqlrruzujqwvjdutnhq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TPg8Gw1qkiz3qRgYCFFDXA_4UV9gVlq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
