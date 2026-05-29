import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(40),
  type: z.enum(['income', 'expense']),
  icon: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use formato hex #RRGGBB')
    .nullable()
    .optional(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;
