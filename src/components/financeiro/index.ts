/**
 * Componentes do módulo Financeiro
 * 
 * @example
 * ```typescript
 * import {
 *   FinanceiroSummaryCards,
 *   TransacoesFilters,
 *   TransacaoFormDialog,
 *   TransacaoLiquidarDialog,
 *   TransacoesListView,
 *   TransacoesTableView,
 *   TransacaoCard,
 * } from '@/components/financeiro';
 * ```
 */

export { FinanceiroSummaryCards } from './FinanceiroSummaryCards';
export { TransacoesFilters } from './TransacoesFilters';
export { TransacaoFormDialog } from './TransacaoFormDialog';
export type { TransacaoFormData } from './TransacaoFormDialog';
export { TransacaoLiquidarDialog } from './TransacaoLiquidarDialog';
export { TransacoesListView } from './TransacoesListView';
export { TransacoesTableView } from './TransacoesTableView';
export { TransacaoCard } from './TransacaoCard';

// Re-export dos componentes existentes
export { default as BankBalanceWidget } from './BankBalanceWidget';
export { default as TabelaGestaoBancos } from './TabelaGestaoBancos';

