/**
 * authStore — sessão, profile, household_id (seção 8 + 11).
 *
 * Responsabilidades:
 *   - Inicializar: ler sessão persistida do Supabase no boot.
 *   - signIn / signOut / recoverPassword.
 *   - Após login, carregar o `profile` (e portanto `household_id`) ANTES de
 *     liberar a navegação — todas as queries dependem dele via RLS.
 *   - Limpar dataStore no logout (mutually-referenced via dynamic import).
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import * as profileSvc from '@/services/supabase/profile';
import type { Profile, UUID } from '@/types/domain';

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const user = ref<User | null>(null);
  const profile = ref<Profile | null>(null);
  const ready = ref(false);
  const loading = ref(false);

  const isAuthenticated = computed(() => session.value !== null && profile.value !== null);
  const householdId = computed(() => profile.value?.household_id ?? null);

  async function loadProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    profile.value = data as Profile;
  }

  /** Chamado no boot do app (main.ts) e antes de qualquer guard. */
  async function init(): Promise<void> {
    if (ready.value) return;
    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    user.value = data.session?.user ?? null;
    if (user.value) {
      try {
        await loadProfile(user.value.id);
      } catch {
        // Perfil ainda não existe (ex.: owner ainda não criou no painel).
        // Mantemos sessão mas a guard tratará como não autenticado.
        profile.value = null;
      }
    }
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession;
      user.value = newSession?.user ?? null;
      if (!newSession) profile.value = null;
    });
    ready.value = true;
  }

  async function signIn(email: string, password: string): Promise<void> {
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      session.value = data.session;
      user.value = data.user;
      if (data.user) await loadProfile(data.user.id);
    } finally {
      loading.value = false;
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    session.value = null;
    user.value = null;
    profile.value = null;
    // Limpa dados crus do household (lazy import evita ciclo).
    const { useDataStore } = await import('@/stores/data');
    useDataStore().reset();
  }

  async function recoverPassword(email: string): Promise<void> {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  /** Gera novo quick_token para o profile corrente. Atualiza local. */
  async function regenerateQuickToken(): Promise<UUID> {
    const token = await profileSvc.regenerateQuickToken();
    if (profile.value) profile.value = { ...profile.value, quick_token: token };
    return token;
  }

  /** Desativa o atalho do iPhone (limpa token). */
  async function clearQuickToken(): Promise<void> {
    await profileSvc.clearQuickToken();
    if (profile.value) profile.value = { ...profile.value, quick_token: null };
  }

  return {
    session,
    user,
    profile,
    ready,
    loading,
    isAuthenticated,
    householdId,
    init,
    signIn,
    signOut,
    recoverPassword,
    regenerateQuickToken,
    clearQuickToken,
  };
});
