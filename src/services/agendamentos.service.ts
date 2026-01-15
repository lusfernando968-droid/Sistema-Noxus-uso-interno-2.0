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

/**
 * Agendamento com dados completos do projeto e cliente (via JOIN)
 */
export interface AgendamentoComDetalhes extends Agendamento {
    projeto_titulo?: string;
    projeto_status?: string;
    projeto_valor_total?: number;
    projeto_valor_por_sessao?: number;
    projeto_quantidade_sessoes?: number;
    cliente_id?: string;
    cliente_nome?: string;
    cliente_email?: string;
    cliente_telefone?: string;
    cliente_instagram?: string;
    cliente_foto_url?: string;
    tem_sessao_registrada?: boolean;
    tem_transacao_registrada?: boolean;
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
     * Busca todos os agendamentos do usuário (query simples)
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
     * Busca todos os agendamentos com dados do projeto e cliente (query otimizada com JOINs)
     * Usa a view agendamentos_com_detalhes para evitar N+1 queries
     */
    static async fetchAllWithRelations(userId: string): Promise<AgendamentoComDetalhes[]> {
        try {
            // Tenta usar a view otimizada primeiro
            const { data, error } = await supabase
                .from('agendamentos_com_detalhes')
                .select('*')
                .eq('user_id', userId)
                .order('data', { ascending: false });

            if (error) {
                // Fallback: usa query com JOINs inline se a view não existir
                console.warn('View agendamentos_com_detalhes não disponível, usando fallback');
                return this.fetchAllWithRelationsFallback(userId);
            }

            return (data || []).map(row => ({
                id: row.id,
                user_id: row.user_id,
                projeto_id: row.projeto_id,
                titulo: row.titulo,
                descricao: row.descricao,
                data: row.data,
                hora: row.hora,
                status: row.status,
                valor_estimado: row.valor_estimado,
                created_at: row.created_at,
                updated_at: row.updated_at,
                projeto_titulo: row.projeto_titulo,
                projeto_status: row.projeto_status,
                projeto_valor_total: row.projeto_valor_total,
                projeto_valor_por_sessao: row.projeto_valor_por_sessao,
                projeto_quantidade_sessoes: row.projeto_quantidade_sessoes,
                cliente_id: row.cliente_id,
                cliente_nome: row.cliente_nome,
                cliente_email: row.cliente_email,
                cliente_telefone: row.cliente_telefone,
                cliente_instagram: row.cliente_instagram,
                cliente_foto_url: row.cliente_foto_url,
                tem_sessao_registrada: row.tem_sessao_registrada,
                tem_transacao_registrada: row.tem_transacao_registrada,
            }));
        } catch (error: any) {
            throw new AgendamentosServiceError(
                'Erro ao buscar agendamentos com detalhes',
                'FETCH_WITH_RELATIONS_ERROR',
                error
            );
        }
    }

    /**
     * Fallback: busca agendamentos com JOINs inline do Supabase
     * Usado quando a view não está disponível
     */
    private static async fetchAllWithRelationsFallback(userId: string): Promise<AgendamentoComDetalhes[]> {
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
                *,
                projetos (
                    id,
                    titulo,
                    status,
                    valor_total,
                    valor_por_sessao,
                    quantidade_sessoes,
                    clientes (
                        id,
                        nome,
                        email,
                        telefone,
                        instagram,
                        foto_url
                    )
                )
            `)
            .eq('user_id', userId)
            .order('data', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            projeto_id: row.projeto_id,
            titulo: row.titulo,
            descricao: row.descricao,
            data: row.data,
            hora: row.hora,
            status: row.status,
            valor_estimado: row.valor_estimado,
            created_at: row.created_at,
            updated_at: row.updated_at,
            projeto_titulo: row.projetos?.titulo,
            projeto_status: row.projetos?.status,
            projeto_valor_total: row.projetos?.valor_total,
            projeto_valor_por_sessao: row.projetos?.valor_por_sessao,
            projeto_quantidade_sessoes: row.projetos?.quantidade_sessoes,
            cliente_id: row.projetos?.clientes?.id,
            cliente_nome: row.projetos?.clientes?.nome,
            cliente_email: row.projetos?.clientes?.email,
            cliente_telefone: row.projetos?.clientes?.telefone,
            cliente_instagram: row.projetos?.clientes?.instagram,
            cliente_foto_url: row.projetos?.clientes?.foto_url,
            tem_sessao_registrada: false, // Não disponível no fallback
            tem_transacao_registrada: false, // Não disponível no fallback
        }));
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
     * 
     * OTIMIZAÇÃO: Usa query única com JOINs para buscar todos os dados necessários
     */
    static async confirmarSessao(
        agendamentoId: string,
        userId: string,
        feedback?: string,
        observacoes?: string,
        avaliacao?: number
    ): Promise<void> {
        try {
            // Query ÚNICA otimizada: busca agendamento + projeto + cliente em uma só chamada
            const { data: agendamento, error: agError } = await supabase
                .from('agendamentos')
                .select(`
                    *,
                    projetos (
                        id,
                        titulo,
                        cliente_id,
                        clientes (
                            id,
                            nome
                        )
                    )
                `)
                .eq('id', agendamentoId)
                .eq('user_id', userId)
                .single();

            if (agError) throw agError;

            const projeto = agendamento.projetos as any;
            const cliente = projeto?.clientes as any;

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

            // Criar transação mesmo que o valor seja 0 (conforme solicitado)
            if (agendamento.valor_estimado !== undefined && agendamento.valor_estimado !== null) {
                const clienteNome = cliente?.nome || 'Cliente';
                await this.createTransacaoOtimizada(
                    userId,
                    agendamentoId,
                    agendamento.valor_estimado,
                    agendamento.data,
                    agendamento.titulo,
                    clienteNome
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
     * @deprecated Use createTransacaoOtimizada que já recebe o nome do cliente
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

    /**
     * Cria uma transação financeira (versão otimizada)
     * Já recebe todos os dados necessários, evitando queries adicionais
     * @private
     */
    private static async createTransacaoOtimizada(
        userId: string,
        agendamentoId: string,
        valor: number,
        data: string,
        titulo: string,
        clienteNome: string
    ): Promise<void> {
        const descricaoCompleta = `Sessão realizada: ${titulo} - ${clienteNome}`;

        // Verificar se já existe transação (usar upsert seria ideal, mas mantemos compatibilidade)
        const { data: existingTransacao } = await supabase
            .from('transacoes')
            .select('id')
            .eq('agendamento_id', agendamentoId)
            .maybeSingle();

        if (existingTransacao) {
            // Atualizar descrição
            await supabase
                .from('transacoes')
                .update({ descricao: descricaoCompleta })
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
                    descricao: descricaoCompleta,
                    agendamento_id: agendamentoId,
                });
        }
    }
}
