/**
 * Camada de Serviços - Sistema Noxus
 * 
 * Centraliza toda a lógica de negócio e operações de banco de dados.
 * 
 * @example
 * ```typescript
 * import { ClientesService } from '@/services';
 * 
 * const clientes = await ClientesService.fetchAll(userId);
 * ```
 */

export * from './clientes.service';
export * from './agendamentos.service';
