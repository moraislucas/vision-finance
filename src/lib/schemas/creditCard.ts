import { z } from 'zod';

export const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(40),
  limit_amount: z.coerce.number().nonnegative('Limite deve ser >= 0'),
  closing_day: z.coerce.number().int().min(1).max(31),
  due_day: z.coerce.number().int().min(1).max(31),
  active: z.boolean(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});
export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

export const purchaseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(120),
  total_amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  installments: z.coerce.number().int().min(1, 'Mínimo 1 parcela').max(36),
  purchase_date: z.string().min(1, 'Data é obrigatória'),
  category_id: z.string().uuid().nullable(),
  credit_card_id: z.string().uuid('Selecione um cartão'),
});
export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
