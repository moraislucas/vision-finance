import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Descrição é obrigatória').max(120),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
  category_id: z.string().uuid('Selecione uma categoria').nullable(),
  account_id: z.string().uuid('Selecione uma conta').nullable(),
  notes: z.string().max(500).nullable().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
