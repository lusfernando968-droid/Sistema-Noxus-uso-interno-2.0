import { supabase } from '@/integrations/supabase/client';
import { supabaseLocal, isSupabaseLocalConfigured } from '@/integrations/supabase/local';

/**
 * Tipos de dados
 */
export type TipoTransacao = "RECEITA" | "DESPESA" | "APORTE";

export interface Transacao {
  id: string;
  user_id?: string;
  tipo: TipoTransacao;
  categoria: string;
  valor: number;
  data_vencimento: string;
  data_liquidacao: string | null;
  descricao: string;
  agendamento_id: string | null;
  agendamentos?: {
    titulo: string;
  };
  conta_id?: string | null;
}

export interface Agendamento {
  id: string;
  titulo: string;
  data: string;
  projetos?: {
    clientes?: {
      nome: string;
    } | null;
  } | null;
}

export interface CreateTransacaoDTO {
  tipo: TipoTransacao;
  categoria: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
  agendamento_id?: string | null;
  data_liquidacao?: string | null;
  conta_id?: string | null;
}

export interface UpdateTransacaoDTO {
  tipo?: TipoTransacao;
  categoria?: string;
  valor?: number;
  data_vencimento?: string;
  descricao?: string;
  agendamento_id?: string | null;
  conta_id?: string | null;
}

export interface LiquidarTransacaoDTO {
  data_liquidacao: string;
  conta_id: string;
}

export interface CreateAporteDTO {
  valor: number;
  data_vencimento: string;
  descricao: string;
  conta_origem_id: string;
  conta_destino_id: string;
  liquidarImediatamente: boolean;
  agendamento_id?: string | null;
}

/**
 * Erros customizados
 */
export class TransacoesServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'TransacoesServiceError';
  }
}

/**
 * Serviço de Transações
 * 
 * Centraliza toda a lógica de negócio relacionada a transações financeiras,
 * incluindo operações CRUD, liquidação e sincronização com carteira.
 */
export class TransacoesService {
  /**
   * Busca todas as transações do usuário
   */
  static async fetchAll(userId: string): Promise<Transacao[]> {
    try {
      const { data, error } = await supabase
        .from("transacoes")
        .select(`
          *,
          agendamentos (
            titulo
          )
        `)
        .eq("user_id", userId)
        .order("data_vencimento", { ascending: false });

      if (error) throw error;

      return (data || []).map(t => ({
        ...t,
        tipo: t.tipo as TipoTransacao
      }));
    } catch (error: unknown) {
      throw new TransacoesServiceError(
        'Erro ao buscar transações',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Busca todos os agendamentos disponíveis para vincular
   */
  static async fetchAgendamentos(): Promise<Agendamento[]> {
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          id, 
          titulo, 
          data,
          projetos (
            clientes (
              nome
            )
          )
        `)
        .order("data", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: unknown) {
      throw new TransacoesServiceError(
        'Erro ao buscar agendamentos',
        'FETCH_AGENDAMENTOS_ERROR',
        error
      );
    }
  }

  /**
   * Cria uma nova transação
   */
  static async create(
    userId: string,
    data: CreateTransacaoDTO
  ): Promise<{ success: boolean; warning?: string }> {
    try {
      const payload = {
        user_id: userId,
        tipo: data.tipo,
        categoria: data.categoria,
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        descricao: data.descricao,
        agendamento_id: data.agendamento_id || null,
        data_liquidacao: data.data_liquidacao || null,
        conta_id: data.conta_id || null,
      };

      const { data: created, error } = await supabase
        .from("transacoes")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        const msg = String(error.message || "");
        const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");

        if (isSchemaCacheConta) {
          const fallback = { ...payload } as Record<string, unknown>;
          delete fallback.conta_id;

          const { error: err2 } = await supabase
            .from("transacoes")
            .insert(fallback);

          if (err2) throw err2;

          return {
            success: true,
            warning: "Transação criada sem conta_id. Aplique a migration."
          };
        }
        throw error;
      }

      // Sincronizar com carteira se liquidada
      if (created && data.data_liquidacao && data.conta_id) {
        await this.syncToCarteira({
          user_id: userId,
          tipo: data.tipo === 'DESPESA' ? 'DESPESA' : 'RECEITA',
          categoria: data.categoria,
          valor: data.valor,
          data_vencimento: data.data_vencimento,
          descricao: data.descricao,
          agendamento_id: data.agendamento_id || null,
          data_liquidacao: data.data_liquidacao,
          conta_id: data.conta_id,
        });
      }

      return { success: true };
    } catch (error: unknown) {
      throw new TransacoesServiceError(
        'Erro ao criar transação',
        'CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Cria um aporte (transferência entre contas)
   */
  static async createAporte(
    userId: string,
    data: CreateAporteDTO
  ): Promise<{ success: boolean; warning?: string }> {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const dataLiquidacao = data.liquidarImediatamente ? hoje : null;

      // Criar transação de saída (despesa)
      const despesaPayload = {
        user_id: userId,
        tipo: "DESPESA" as const,
        categoria: "Aporte",
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        descricao: data.descricao || "Aporte para outra conta",
        agendamento_id: data.agendamento_id || null,
        data_liquidacao: dataLiquidacao,
        conta_id: data.conta_origem_id,
      };

      let createdDespId: string | null = null;
      let warning: string | undefined;

      const { data: createdDesp, error: errDesp } = await supabase
        .from("transacoes")
        .insert(despesaPayload)
        .select("id")
        .single();

      if (errDesp) {
        const msg = String(errDesp.message || "");
        const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");

        if (!isSchemaCacheConta) throw errDesp;

        const fallbackDesp = { ...despesaPayload } as Record<string, unknown>;
        delete fallbackDesp.conta_id;

        const { data: createdDesp2, error: errDesp2 } = await supabase
          .from("transacoes")
          .insert(fallbackDesp)
          .select("id")
          .single();

        if (errDesp2) throw errDesp2;

        createdDespId = createdDesp2?.id;
        warning = "Aporte criado sem conta_id. Aplique a migration.";
      } else {
        createdDespId = createdDesp?.id;
      }

      // Criar transação de entrada (receita)
      const receitaPayload = {
        user_id: userId,
        tipo: "RECEITA" as const,
        categoria: "Aporte",
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        descricao: data.descricao || "Aporte recebido de outra conta",
        agendamento_id: data.agendamento_id || null,
        data_liquidacao: dataLiquidacao,
        conta_id: data.conta_destino_id,
      };

      const { error: errRec } = await supabase
        .from("transacoes")
        .insert(receitaPayload);

      if (errRec) {
        const msg = String(errRec.message || "");
        const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");

        if (!isSchemaCacheConta) {
          // Rollback da despesa
          if (createdDespId) {
            await supabase.from("transacoes").delete().eq("id", createdDespId);
          }
          throw errRec;
        }

        const fallbackRec = { ...receitaPayload } as Record<string, unknown>;
        delete fallbackRec.conta_id;

        const { error: errRec2 } = await supabase
          .from("transacoes")
          .insert(fallbackRec);

        if (errRec2) {
          if (createdDespId) {
            await supabase.from("transacoes").delete().eq("id", createdDespId);
          }
          throw errRec2;
        }

        warning = "Aporte destino criado sem conta_id. Aplique a migration.";
      }

      return { success: true, warning };
    } catch (error: unknown) {
      throw new TransacoesServiceError(
        'Erro ao criar aporte',
        'CREATE_APORTE_ERROR',
        error
      );
    }
  }

  /**
   * Atualiza uma transação existente
   */
  static async update(
    transacaoId: string,
    data: UpdateTransacaoDTO
  ): Promise<{ success: boolean; warning?: string }> {
    try {
      const updatePayload: Record<string, unknown> = {};

      if (data.tipo !== undefined) updatePayload.tipo = data.tipo;
      if (data.categoria !== undefined) updatePayload.categoria = data.categoria;
      if (data.valor !== undefined) updatePayload.valor = data.valor;
      if (data.data_vencimento !== undefined) updatePayload.data_vencimento = data.data_vencimento;
      if (data.descricao !== undefined) updatePayload.descricao = data.descricao;
      if (data.agendamento_id !== undefined) updatePayload.agendamento_id = data.agendamento_id;
      if (data.conta_id !== undefined) updatePayload.conta_id = data.conta_id;

      const { error } = await supabase
        .from("transacoes")
        .update(updatePayload)
        .eq("id", transacaoId);

      if (error) {
        const msg = String(error.message || "");
        const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");

        if (isSchemaCacheConta) {
          delete updatePayload.conta_id;

          const { error: errRetry } = await supabase
            .from("transacoes")
            .update(updatePayload)
            .eq("id", transacaoId);

          if (errRetry) throw errRetry;

          return {
            success: true,
            warning: "Transação atualizada sem vincular conta. Aplique a migration de conta_id."
          };
        }
        throw error;
      }

      return { success: true };
    } catch (error: unknown) {
      throw new TransacoesServiceError(
        'Erro ao atualizar transação',
        'UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Liquida (dar baixa) uma transação
   */
  static async liquidar(
    transacaoId: string,
    userId: string,
    data: LiquidarTransacaoDTO,
    transacaoOriginal: Transacao
  ): Promise<{ success: boolean; warning?: string }> {
    try {
      const payload: Record<string, unknown> = {
        data_liquidacao: data.data_liquidacao,
        conta_id: data.conta_id,
      };

      const { error } = await supabase
        .from("transacoes")
        .update(payload)
        .eq("id", transacaoId);

      if (error) {
        const msg = String(error.message || "");
        const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");

        if (isSchemaCacheConta) {
          const { error: errRetry } = await supabase
            .from("transacoes")
            .update({ data_liquidacao: data.data_liquidacao })
            .eq("id", transacaoId);

          if (errRetry) throw errRetry;

          // Sincronizar com carteira mesmo sem conta_id na transação
          await this.syncToCarteira({
            user_id: userId,
            tipo: transacaoOriginal.tipo === 'DESPESA' ? 'DESPESA' : 'RECEITA',
            categoria: transacaoOriginal.categoria,
            valor: transacaoOriginal.valor,
            data_vencimento: transacaoOriginal.data_vencimento,
            descricao: transacaoOriginal.descricao,
            agendamento_id: transacaoOriginal.agendamento_id,
            data_liquidacao: data.data_liquidacao,
            conta_id: data.conta_id,
          });

          return {
            success: true,
            warning: "Baixa feita sem vincular conta na tabela transacoes. Aplique a migration de conta_id."
          };
        }
        throw error;
      }

      // Sincronizar com carteira
      await this.syncToCarteira({
        user_id: userId,
        tipo: transacaoOriginal.tipo === 'DESPESA' ? 'DESPESA' : 'RECEITA',
        categoria: transacaoOriginal.categoria,
        valor: transacaoOriginal.valor,
        data_vencimento: transacaoOriginal.data_vencimento,
        descricao: transacaoOriginal.descricao,
        agendamento_id: transacaoOriginal.agendamento_id,
        data_liquidacao: data.data_liquidacao,
        conta_id: data.conta_id,
      });

      return { success: true };
    } catch (error: unknown) {
      throw new TransacoesServiceError(
        'Erro ao liquidar transação',
        'LIQUIDAR_ERROR',
        error
      );
    }
  }

  /**
   * Deleta uma transação
   */
  static async delete(transacaoId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("transacoes")
        .delete()
        .eq("id", transacaoId);

      if (error) throw error;
    } catch (error: unknown) {
      throw new TransacoesServiceError(
        'Erro ao deletar transação',
        'DELETE_ERROR',
        error
      );
    }
  }

  /**
   * Sincroniza uma transação liquidada com a tabela financeiro_tattoo (carteira)
   */
  private static async syncToCarteira(data: {
    user_id: string;
    tipo: 'RECEITA' | 'DESPESA';
    categoria: string;
    valor: number;
    data_vencimento: string;
    descricao: string;
    agendamento_id: string | null;
    data_liquidacao: string;
    conta_id: string;
  }): Promise<void> {
    try {
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;

      // Verificar se já existe
      const filtro = {
        user_id: data.user_id,
        descricao: data.descricao,
        valor: data.valor,
        categoria: data.categoria,
        data_vencimento: data.data_vencimento,
        conta_id: data.conta_id,
        data_liquidacao: data.data_liquidacao,
      };

      const { data: exists } = await sb
        .from("financeiro_tattoo")
        .select("id")
        .match(filtro)
        .limit(1);

      if (exists && exists.length > 0) return;

      // Inserir na carteira
      await sb.from("financeiro_tattoo").insert({
        user_id: data.user_id,
        tipo: data.tipo,
        categoria: data.categoria,
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        descricao: data.descricao,
        agendamento_id: data.agendamento_id,
        data_liquidacao: data.data_liquidacao,
        conta_id: data.conta_id,
      });
    } catch {
      // Ignora erros de sincronização - não é crítico
    }
  }

  /**
   * Sincroniza todas as transações liquidadas com a carteira
   */
  static async syncAllToCarteira(transacoes: Transacao[]): Promise<void> {
    try {
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const list = transacoes.filter(t => !!t.data_liquidacao && !!t.conta_id);

      for (const t of list) {
        const filtro = {
          user_id: (t as unknown as { user_id: string }).user_id,
          descricao: t.descricao,
          valor: t.valor,
          categoria: t.categoria,
          data_vencimento: t.data_vencimento,
          conta_id: t.conta_id,
          data_liquidacao: t.data_liquidacao,
        };

        const { data: exists } = await sb
          .from("financeiro_tattoo")
          .select("id")
          .match(filtro)
          .limit(1);

        if (!exists || !exists.length) {
          await sb.from("financeiro_tattoo").insert({
            user_id: (t as unknown as { user_id: string }).user_id,
            tipo: t.tipo,
            categoria: t.categoria,
            valor: Number(t.valor || 0),
            data_vencimento: t.data_vencimento,
            descricao: t.descricao,
            agendamento_id: t.agendamento_id || null,
            data_liquidacao: t.data_liquidacao,
            conta_id: t.conta_id,
          });
        }
      }
    } catch {
      // Ignora erros de sincronização
    }
  }
}

/**
 * Categorias disponíveis
 */
export const CATEGORIAS_RECEITA = [
  "Pagamento de Cliente",
  "Adiantamento",
  "Projeto Concluído",
  "Consultoria",
  "Manutenção",
  "Outros"
];

export const CATEGORIAS_DESPESA = [
  "Fornecedor",
  "Salário",
  "Infraestrutura",
  "Marketing",
  "Equipamento",
  "Material",
  "Outros"
];

