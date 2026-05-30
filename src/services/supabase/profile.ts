/**
 * Profile service — operações sobre `public.profiles` do usuário logado.
 *
 * `quick_token` é gerado/limpado via RPC (não via UPDATE direto) porque a
 * coluna tem unique constraint e a RPC garante `auth.uid()` filtering.
 */
import { supabase } from './index';
import type { Profile, UUID } from '@/types/domain';

/** Busca o profile do usuário corrente. */
export async function fetchSelf(userId: UUID): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/** Gera novo quick_token para o profile corrente e devolve o UUID. */
export async function regenerateQuickToken(): Promise<UUID> {
  const { data, error } = await supabase.rpc('regenerate_quick_token');
  if (error) throw error;
  return data as UUID;
}

/** Apaga o quick_token (desativa o atalho do iPhone). */
export async function clearQuickToken(): Promise<void> {
  const { error } = await supabase.rpc('clear_quick_token');
  if (error) throw error;
}
