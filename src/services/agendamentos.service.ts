import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos de dados
 */
export interface Agendamento {
    id: string;
    user_id?: string;
    projeto_id?: string;
    titulo: string;
    descricao?: string;
    data: string;
    hora: string;
    status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    valor_estimado?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateAgendamentoDTO {
    projeto_id: string;
    titulo: string;
    descricao?: string;
    data: string;
    hora: string;
    status?: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    valor_estimado?: number;
}

export interface UpdateAgendamentoDTO {
    titulo?: string;
    descricao?: string;
    data?: string;
    hora?: string;
    status?: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    valor_estimado?: number;
}

/**
 * Erros customizados
 */
export class AgendamentosServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'AgendamentosServiceError';
    }
}

/**
 * Serviço de Agendamentos
 * 
 * Centraliza toda a lógica de negócio relacionada a agendamentos.
 */
export class AgendamentosService {
    /**
     * Busca todos os agendamentos do usuário
     */
    static async fetchAll(userId: string): Promise<Agendamento[]> {
        try {
            const { data, error } = await supabase
                .from('agendamentos')
                .select('*')
                .eq('user_id', userId)
                .order('data', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error: any) {
            throw new AgendamentosServiceError(
                'Erro ao buscar agendamentos',
                'FETCH_ERROR',
                error
            );
        }
    }

    /**
     * Busca agendamentos por projeto
     */
    static async fetchByProjeto(projetoId: string): Promise<Agendamento[]> {
        try {
            const { data, error } = await supabase
                .from('agendamentos')
                .select('*')
                .eq('projeto_id', projetoId)
                .order('data', { ascending: true });

            if (error) throw error;

            return data || [];
        } catch (error: any) {
            throw new AgendamentosServiceError(
                'Erro ao buscar agendamentos do projeto',
                'FETCH_BY_PROJETO_ERROR',
                error
            );
        }
    }

    /**
     * Cria um novo agendamento
     */
    static async create(
        userId: string,
        data: CreateAgendamentoDTO
    ): Promise<Agendamento> {
        try {
            const payload = {
                user_id: userId,
                ...data,
                status: data.status || 'agendado',
            };

            const { data: agendamento, error } = await supabase
                .from('agendamentos')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            return agendamento;
        } catch (error: any) {
            throw new AgendamentosServiceError(
                'Erro ao criar agendamento',
                'CREATE_ERROR',
                error
            );
        }
    }

    /**
     * Atualiza um agendamento
     */
    static async update(
        agendamentoId: string,
        userId: string,
        data: UpdateAgendamentoDTO
    ): Promise<Agendamento> {
        try {
            const { data: agendamento, error } = await supabase
                .from('agendamentos')
                .update(data)
                .eq('id', agendamentoId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;

            return agendamento;
        } catch (error: any) {
            throw new AgendamentosServiceError(
                'Erro ao atualizar agendamento',
                'UPDATE_ERROR',
                error
            );
        }
    }

    /**
     * Deleta um agendamento
     */
    static async delete(agendamentoId: string, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('agendamentos')
                .delete()
                .eq('id', agendamentoId)
                .eq('user_id', userId);

            if (error) throw error;
        } catch (error: any) {
            throw new AgendamentosServiceError(
                'Erro ao deletar agendamento',
                'DELETE_ERROR',
                error
            );
        }
    }

    /**
     * Confirma uma sessão realizada
     * Cria registros em projeto_sessoes e transacoes
     */
    static async confirmarSessao(
        agendamentoId: string,
        userId: string,
        feedback?: string,
        observacoes?: string,
        avaliacao?: number
    ): Promise<void> {
        try {
            // Buscar agendamento com projeto
            const { data: agendamento, error: agError } = await supabase
                .from('agendamentos')
                .select('*, projetos (id, cliente_id)')
                .eq('id', agendamentoId)
                .eq('user_id', userId)
                .single();

            if (agError) throw agError;

            const projeto = agendamento.projetos as any;

            // Atualizar status do agendamento
            await this.update(agendamentoId, userId, { status: 'concluido' });

            // Criar/atualizar sessão do projeto
            if (projeto?.id) {
                await this.createOrUpdateSessao(
                    projeto.id,
                    agendamentoId,
                    agendamento.data,
                    agendamento.valor_estimado || 0,
                    feedback,
                    observacoes,
                    avaliacao
                );
            }

            // Criar transação se houver valor
            if (agendamento.valor_estimado && agendamento.valor_estimado > 0) {
                await this.createTransacao(
                    userId,
                    agendamentoId,
                    agendamento.valor_estimado,
                    agendamento.data,
                    agendamento.titulo
                );
            }
        } catch (error: any) {
            throw new AgendamentosServiceError(
                'Erro ao confirmar sessão',
                'CONFIRM_SESSAO_ERROR',
                error
            );
        }
    }

    /**
     * Cria ou atualiza uma sessão de projeto
     * @private
     */
    private static async createOrUpdateSessao(
        projetoId: string,
        agendamentoId: string,
        data: string,
        valor: number,
        feedback?: string,
        observacoes?: string,
        avaliacao?: number
    ): Promise<void> {
        // Verificar se já existe sessão
        const { data: existingSessao } = await supabase
            .from('projeto_sessoes')
            .select('id')
            .eq('projeto_id', projetoId)
            .eq('agendamento_id', agendamentoId)
            .maybeSingle();

        if (existingSessao) {
            // Atualizar existente
            await supabase
                .from('projeto_sessoes')
                .update({
                    feedback_cliente: feedback || null,
                    observacoes_tecnicas: observacoes || null,
                    valor_sessao: valor,
                    data_sessao: data,
                    avaliacao: avaliacao || null,
                })
                .eq('id', existingSessao.id);
        } else {
            // Criar nova
            const { data: sessoes } = await supabase
                .from('projeto_sessoes')
                .select('id')
                .eq('projeto_id', projetoId);

            const numeroSessao = (sessoes?.length || 0) + 1;

            await supabase
                .from('projeto_sessoes')
                .insert({
                    projeto_id: projetoId,
                    agendamento_id: agendamentoId,
                    numero_sessao: numeroSessao,
                    data_sessao: data,
                    valor_sessao: valor,
                    status_pagamento: 'pendente',
                    observacoes_tecnicas: observacoes || null,
                    feedback_cliente: feedback || null,
                    avaliacao: avaliacao || null,
                });
        }
    }

    /**
     * Cria uma transação financeira
     * @private
     */
    private static async createTransacao(
        userId: string,
        agendamentoId: string,
        valor: number,
        data: string,
        descricao: string
    ): Promise<void> {
        // Verificar se já existe transação
        const { data: existingTransacao } = await supabase
            .from('transacoes')
            .select('id')
            .eq('agendamento_id', agendamentoId)
            .maybeSingle();

        if (existingTransacao) {
            // Atualizar descrição
            await supabase
                .from('transacoes')
                .update({ descricao: `Sessão realizada: ${descricao}` })
                .eq('id', existingTransacao.id);
        } else {
            // Criar nova
            await supabase
                .from('transacoes')
                .insert({
                    user_id: userId,
                    tipo: 'RECEITA',
                    categoria: 'Serviços',
                    valor,
                    data_vencimento: data,
                    descricao: `Sessão realizada: ${descricao}`,
                    agendamento_id: agendamentoId,
                });
        }
    }
}
