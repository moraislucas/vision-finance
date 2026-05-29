import { supabase } from './index';
import type { CreditCard, CreditCardPurchase, UUID } from '@/types/domain';

// --- Cartões -----------------------------------------------------------------

export type NewCreditCard = Omit<CreditCard, 'id' | 'created_at'>;
export type CreditCardPatch = Partial<Omit<CreditCard, 'id' | 'household_id' | 'created_at'>>;

export async function listCreditCards(householdId: UUID): Promise<CreditCard[]> {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CreditCard[];
}

export async function createCreditCard(payload: NewCreditCard): Promise<CreditCard> {
  const { data, error } = await supabase.from('credit_cards').insert(payload).select('*').single();
  if (error) throw error;
  return data as CreditCard;
}

export async function updateCreditCard(id: UUID, patch: CreditCardPatch): Promise<CreditCard> {
  const { data, error } = await supabase.from('credit_cards').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as CreditCard;
}

export async function removeCreditCard(id: UUID): Promise<void> {
  const { error } = await supabase.from('credit_cards').delete().eq('id', id);
  if (error) throw error;
}

// --- Compras do cartão -------------------------------------------------------

export type NewCreditCardPurchase = Omit<CreditCardPurchase, 'id' | 'created_at'>;
export type CreditCardPurchasePatch = Partial<Omit<CreditCardPurchase, 'id' | 'household_id' | 'created_at'>>;

export async function listCreditCardPurchases(householdId: UUID): Promise<CreditCardPurchase[]> {
  const { data, error } = await supabase
    .from('credit_card_purchases')
    .select('*')
    .eq('household_id', householdId)
    .order('purchase_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CreditCardPurchase[];
}

export async function createCreditCardPurchase(payload: NewCreditCardPurchase): Promise<CreditCardPurchase> {
  const { data, error } = await supabase
    .from('credit_card_purchases')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as CreditCardPurchase;
}

export async function updateCreditCardPurchase(
  id: UUID,
  patch: CreditCardPurchasePatch,
): Promise<CreditCardPurchase> {
  const { data, error } = await supabase
    .from('credit_card_purchases')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as CreditCardPurchase;
}

export async function removeCreditCardPurchase(id: UUID): Promise<void> {
  const { error } = await supabase.from('credit_card_purchases').delete().eq('id', id);
  if (error) throw error;
}
