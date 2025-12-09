/**
 * Camada de Serviços - Sistema Noxus
 * 
 * Centraliza toda a lógica de negócio e operações de banco de dados.
 * Usa queries otimizadas com JOINs para evitar problemas N+1.
 * 
 * @example
 * ```typescript
 * import { ClientesService, ProjetosService, AgendamentosService } from '@/services';
 * 
 * // Clientes com LTV calculado (via view)
 * const clientes = await ClientesService.fetchAll(userId);
 * 
 * // Projetos com métricas (sessões, valor pago)
 * const projetos = await ProjetosService.fetchAllWithMetrics(userId);
 * 
 * // Agendamentos com dados do projeto e cliente
 * const agendamentos = await AgendamentosService.fetchAllWithRelations(userId);
 * ```
 */

export * from './clientes.service';
export * from './agendamentos.service';
export * from './projetos.service';
export * from './transacoes.service';
