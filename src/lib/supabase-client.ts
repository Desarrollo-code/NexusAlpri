// src/lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Las variables de entorno de Supabase (URL y Anon Key) deben ser proporcionadas.');
}

if (!supabaseServiceKey) {
    console.warn('ADVERTENCIA: La variable SUPABASE_SERVICE_ROLE_KEY no está configurada. El cliente de administrador de Supabase no estará disponible y las operaciones de backend fallarán.');
}

// Cliente de administrador para el lado del servidor (API Routes)
// Este cliente puede saltarse las políticas de RLS. Úsalo con cuidado y solo en el backend.
export const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
      })
    : null;
