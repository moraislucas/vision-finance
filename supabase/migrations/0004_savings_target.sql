-- =============================================================================
-- Vision Finance — Migration 0004: margem de poupança garantida
--
-- Adiciona `monthly_savings_target` em `settings` — valor em R$ que SEMPRE
-- deve sobrar no fim do mês como poupança automática, ALÉM do que está
-- earmarcado em metas.
--
-- A engine financeira lê este valor e desconta antes de calcular o "Pode Gastar
-- por dia". Se o saldo livre não cobre a margem, o Pode Gastar vira R$ 0 e a
-- UI mostra um alerta de "mês apertado".
--
-- NULL ou 0 = sem margem (comportamento original, alinhado à seção 9.5 do
-- VISION_FINANCE_CONTEXT.md).
-- =============================================================================

alter table public.settings
  add column if not exists monthly_savings_target numeric(14,2);

comment on column public.settings.monthly_savings_target is
  'Margem de poupança automática (R$) que SEMPRE deve sobrar no fim do mês, '
  'além das metas. NULL = desligado.';
