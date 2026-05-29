/**
 * Engine Financeira — barrel.
 *
 * IMPORTE SEMPRE daqui (`@/lib/finance`). As funções são puras: recebem
 * arrays/objetos crus e devolvem números. Não tocam Pinia, não tocam Supabase,
 * não tocam DOM. Isso torna a Engine trivialmente testável e independente.
 *
 * Mapeamento com a seção 9.9:
 *   getCurrentBalance / getAccountBalance      → balance.ts (9.1)
 *   getReserved / getAvailableNow              → balance.ts (9.1, 9.3)
 *   getRemainingIncome / getRemainingObligations / getRemainingGoalContributions
 *                                              → recurring.ts + budget.ts + goals.ts (9.2)
 *   getProjectedMonthEndBalance / getFreeBalanceMonth / getBudgetBreakdown
 *                                              → budget.ts (9.5)
 *   getDailyBudget / getWeeklyBudget / getMonthlyBudget
 *                                              → budget.ts (9.5)
 *   getGoalMonthlyTarget / getGoalProgress     → goals.ts (9.3)
 *   getInstallmentDueDate / getCardInvoice / getCardAvailableLimit
 *                                              → credit-cards.ts (9.4)
 *   getProjection                              → projection.ts (9.6)
 *   getFinancialScore                          → score.ts (9.7)
 *   getInsights                                → insights.ts (9.8)
 */
export * from './types';
export * from './balance';
export * from './recurring';
export * from './credit-cards';
export * from './goals';
export * from './budget';
export * from './projection';
export * from './score';
export * from './insights';
export * from './daily-projection';
