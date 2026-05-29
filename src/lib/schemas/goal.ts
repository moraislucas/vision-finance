import { z } from 'zod';

export const goalSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório').max(60),
    target_amount: z.coerce.number().positive('Meta deve ser maior que zero'),
    target_date: z.string().nullable(),
    monthly_contribution: z.coerce.number().nullable(),
    is_emergency: z.boolean(),
    active: z.boolean(),
    icon: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.target_date && (val.monthly_contribution == null || val.monthly_contribution <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um prazo ou uma contribuição mensal',
        path: ['monthly_contribution'],
      });
    }
  });
export type GoalFormValues = z.infer<typeof goalSchema>;

export const contributionSchema = z.object({
  amount: z.coerce.number().refine((v) => v !== 0, 'Valor não pode ser zero'),
  date: z.string().min(1, 'Data é obrigatória'),
});
export type ContributionFormValues = z.infer<typeof contributionSchema>;
