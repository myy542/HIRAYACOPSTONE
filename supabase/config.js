
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// ILISI NI SA IMONG SUPABASE CREDENTIALS
// ============================================

const SUPABASE_URL = 'https://tuujlqrfyuazvbvoribz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dYaVB2zNcNNj5gwjzJ4ZRw_N55Djq0D';

// ============================================
// CREATE SUPABASE CLIENT
// ============================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
});

console.log('✅ Supabase client initialized');
console.log('📍 URL:', SUPABASE_URL);