// src/lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ¡Nueva variable!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in public environment variables.');
}

if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin client will not be available.');
}

// Cliente público para el lado del cliente (navegador)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente de administrador para el lado del servidor (API Routes)
// Este cliente puede saltarse las políticas de RLS. ¡Úsalo con cuidado y solo en el backend!
export const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
      })
    : null;
