/**
 * Cliente Supabase único do app. Use sempre este export — nunca crie outro.
 *
 * Credenciais lidas das envs VITE_ (seção 4). Falha fast se ausentes:
 * preferimos quebrar no boot a errar em produção sem aviso.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Vision Finance: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
      'Configure em .env (ou em .env.local para override).',
  );
}

// NOTA: Quando você gerar tipos com `npm run supabase:types`, troque para
// `SupabaseClient<Database>` para ganhar tipagem completa em from()/insert()/etc.
// O stub manual em `@/types/database` ficou desincronizado com o shape exigido
// por @supabase/supabase-js v2.106+ (Enums/CompositeTypes/__InternalSupabase) —
// mantemos o client untyped até regenerar.
export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
