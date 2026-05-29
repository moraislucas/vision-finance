import { z } from 'zod';

export const recurringIncomeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  day_of_month: z.coerce.number().int().min(1).max(31),
  active: z.boolean(),
});
export type RecurringIncomeFormValues = z.infer<typeof recurringIncomeSchema>;

export const recurringExpenseSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório').max(60),
    amount: z.coerce.number().positive('Valor deve ser maior que zero'),
    due_day: z.coerce.number().int().min(1).max(31),
    frequency: z.enum(['monthly', 'yearly']),
    due_month: z.coerce.number().int().min(1).max(12).nullable(),
    category_id: z.string().uuid().nullable(),
    active: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.frequency === 'yearly' && val.due_month == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para anual, informe o mês',
        path: ['due_month'],
      });
    }
    if (val.frequency === 'monthly' && val.due_month != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mensais não usam mês alvo',
        path: ['due_month'],
      });
    }
  });
export type RecurringExpenseFormValues = z.infer<typeof recurringExpenseSchema>;
