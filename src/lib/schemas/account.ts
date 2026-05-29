import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60),
  type: z.enum(['bank', 'cash']),
  initial_balance: z.coerce.number(),
  include_in_available: z.boolean(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});
export type AccountFormValues = z.infer<typeof accountSchema>;
