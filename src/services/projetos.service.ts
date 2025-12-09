import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos de dados
 */
export interface Projeto {
    id: string;
    user_id?: string;
    cliente_id: string;
    titulo: string;
    descricao?: string;
    status: string;
    notas?: string;
    valor_total?: number;
    valor_por_sessao?: number;
    quantidade_sessoes?: number;
    progresso?: number;
    data_inicio?: string;
    data_estimada_fim?: string;
    local_corpo?: string;
    estilo?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Projeto com métricas calculadas (via JOIN)
 */
export interface ProjetoComMetricas extends Projeto {
    cliente_nome?: string;
    cliente_email?: string;
    cliente_telefone?: string;
    cliente_instagram?: string;
    cliente_foto_url?: string;
    sessoes_realizadas: number;
    valor_pago: number;
    fotos_count: number;
    agendamentos_count: number;
    progresso_calculado: number;
}

export interface CreateProjetoDTO {
    cliente_id: string;
    titulo: string;
    descricao?: string;
    status?: string;
    valor_total?: number;
    valor_por_sessao?: number;
    quantidade_sessoes?: number;
    data_inicio?: string;
    data_estimada_fim?: string;
    local_corpo?: string;
    estilo?: string;
}

export interface UpdateProjetoDTO {
    titulo?: string;
    descricao?: string;
    status?: string;
    notas?: string;
    valor_total?: number;
    valor_por_sessao?: number;
    quantidade_sessoes?: number;
    progresso?: number;
    data_inicio?: string;
    data_estimada_fim?: string;
    local_corpo?: string;
    estilo?: string;
}

/**
 * Erros customizados
 */
export class ProjetosServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'ProjetosServiceError';
    }
}

/**
 * Serviço de Projetos
 * 
 * Centraliza toda a lógica de negócio relacionada a projetos,
 * usando queries otimizadas com JOINs para evitar N+1.
 */
export class ProjetosService {
    /**
     * Busca todos os projetos do usuário (query simples)
     */
    static async fetchAll(userId: string): Promise<Projeto[]> {
        try {
            const { data, error } = await supabase
                .from('projetos')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error: any) {
            throw new ProjetosServiceError(
                'Erro ao buscar projetos',
                'FETCH_ERROR',
                error
            );
        }
    }

    /**
     * Busca todos os projetos com métricas calculadas (query otimizada)
     * Usa a view projetos_com_metricas para evitar N+1 queries
     */
    static async fetchAllWithMetrics(userId: string, clienteIdFilter?: string): Promise<ProjetoComMetricas[]> {
        try {
            // Tenta usar a view otimizada primeiro
            let query = supabase
                .from('projetos_com_metricas')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (clienteIdFilter) {
                query = query.eq('cliente_id', clienteIdFilter);
            }

            const { data, error } = await query;

            if (error) {
                // Fallback: usa query com JOINs inline se a view não existir
                console.warn('View projetos_com_metricas não disponível, usando fallback');
                return this.fetchAllWithMetricsFallback(userId, clienteIdFilter);
            }

            return (data || []).map(row => ({
                id: row.id,
                user_id: row.user_id,
                cliente_id: row.cliente_id,
                titulo: row.titulo,
                descricao: row.descricao,
                status: row.status,
                notas: row.notas,
                valor_total: row.valor_total,
                valor_por_sessao: row.valor_por_sessao,
                quantidade_sessoes: row.quantidade_sessoes,
                progresso: row.progresso,
                data_inicio: row.data_inicio,
                data_estimada_fim: row.data_estimada_fim,
                local_corpo: row.local_corpo,
                estilo: row.estilo,
                created_at: row.created_at,
                updated_at: row.updated_at,
                cliente_nome: row.cliente_nome,
                cliente_email: row.cliente_email,
                cliente_telefone: row.cliente_telefone,
                cliente_instagram: row.cliente_instagram,
                cliente_foto_url: row.cliente_foto_url,
                sessoes_realizadas: row.sessoes_realizadas || 0,
                valor_pago: row.valor_pago || 0,
                fotos_count: row.fotos_count || 0,
                agendamentos_count: row.agendamentos_count || 0,
                progresso_calculado: row.progresso_calculado || 0,
            }));
        } catch (error: any) {
            throw new ProjetosServiceError(
                'Erro ao buscar projetos com métricas',
                'FETCH_WITH_METRICS_ERROR',
                error
            );
        }
    }

    /**
     * Fallback: busca projetos com JOINs inline e calcula métricas
     */
    private static async fetchAllWithMetricsFallback(userId: string, clienteIdFilter?: string): Promise<ProjetoComMetricas[]> {
        let query = supabase
            .from('projetos')
            .select(`
                *,
                clientes (
                    id,
                    nome,
                    email,
                    telefone,
                    instagram,
                    foto_url
                ),
                projeto_sessoes (
                    id,
                    valor_sessao,
                    status_pagamento
                ),
                agendamentos (
                    id
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (clienteIdFilter) {
            query = query.eq('cliente_id', clienteIdFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((row: any) => {
            const sessoes = row.projeto_sessoes || [];
            const sessoesRealizadas = sessoes.length;
            const valorPago = sessoes
                .filter((s: any) => s.status_pagamento === 'pago')
                .reduce((sum: number, s: any) => sum + (s.valor_sessao || 0), 0);
            
            const quantidadeSessoes = row.quantidade_sessoes || 0;
            const progressoCalc = quantidadeSessoes > 0 
                ? Math.min(100, Math.round((sessoesRealizadas / quantidadeSessoes) * 100))
                : 0;

            return {
                id: row.id,
                user_id: row.user_id,
                cliente_id: row.cliente_id,
                titulo: row.titulo,
                descricao: row.descricao,
                status: row.status,
                notas: row.notas,
                valor_total: row.valor_total,
                valor_por_sessao: row.valor_por_sessao,
                quantidade_sessoes: row.quantidade_sessoes,
                progresso: row.progresso,
                data_inicio: row.data_inicio,
                data_estimada_fim: row.data_estimada_fim,
                local_corpo: row.local_corpo,
                estilo: row.estilo,
                created_at: row.created_at,
                updated_at: row.updated_at,
                cliente_nome: row.clientes?.nome,
                cliente_email: row.clientes?.email,
                cliente_telefone: row.clientes?.telefone,
                cliente_instagram: row.clientes?.instagram,
                cliente_foto_url: row.clientes?.foto_url,
                sessoes_realizadas: sessoesRealizadas,
                valor_pago: valorPago,
                fotos_count: 0, // Não calculado no fallback para performance
                agendamentos_count: (row.agendamentos || []).length,
                progresso_calculado: progressoCalc,
            };
        });
    }

    /**
     * Busca um projeto por ID com métricas
     */
    static async fetchById(projetoId: string, userId: string): Promise<ProjetoComMetricas | null> {
        try {
            const { data, error } = await supabase
                .from('projetos')
                .select(`
                    *,
                    clientes (
                        id,
                        nome,
                        email,
                        telefone,
                        instagram,
                        foto_url
                    ),
                    projeto_sessoes (
                        id,
                        valor_sessao,
                        status_pagamento
                    )
                `)
                .eq('id', projetoId)
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            const sessoes = (data as any).projeto_sessoes || [];
            const sessoesRealizadas = sessoes.length;
            const valorPago = sessoes
                .filter((s: any) => s.status_pagamento === 'pago')
                .reduce((sum: number, s: any) => sum + (s.valor_sessao || 0), 0);
            
            const quantidadeSessoes = data.quantidade_sessoes || 0;
            const progressoCalc = quantidadeSessoes > 0 
                ? Math.min(100, Math.round((sessoesRealizadas / quantidadeSessoes) * 100))
                : 0;

            return {
                id: data.id,
                user_id: data.user_id,
                cliente_id: data.cliente_id,
                titulo: data.titulo,
                descricao: data.descricao,
                status: data.status,
                notas: data.notas,
                valor_total: data.valor_total,
                valor_por_sessao: data.valor_por_sessao,
                quantidade_sessoes: data.quantidade_sessoes,
                progresso: data.progresso,
                data_inicio: data.data_inicio,
                data_estimada_fim: data.data_estimada_fim,
                local_corpo: data.local_corpo,
                estilo: data.estilo,
                created_at: data.created_at,
                updated_at: data.updated_at,
                cliente_nome: (data as any).clientes?.nome,
                cliente_email: (data as any).clientes?.email,
                cliente_telefone: (data as any).clientes?.telefone,
                cliente_instagram: (data as any).clientes?.instagram,
                cliente_foto_url: (data as any).clientes?.foto_url,
                sessoes_realizadas: sessoesRealizadas,
                valor_pago: valorPago,
                fotos_count: 0,
                agendamentos_count: 0,
                progresso_calculado: progressoCalc,
            };
        } catch (error: any) {
            throw new ProjetosServiceError(
                'Erro ao buscar projeto',
                'FETCH_BY_ID_ERROR',
                error
            );
        }
    }

    /**
     * Cria um novo projeto
     */
    static async create(userId: string, data: CreateProjetoDTO): Promise<Projeto> {
        try {
            const payload = {
                user_id: userId,
                ...data,
                status: data.status || 'planejamento',
            };

            const { data: projeto, error } = await supabase
                .from('projetos')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            return projeto;
        } catch (error: any) {
            throw new ProjetosServiceError(
                'Erro ao criar projeto',
                'CREATE_ERROR',
                error
            );
        }
    }

    /**
     * Atualiza um projeto
     */
    static async update(projetoId: string, userId: string, data: UpdateProjetoDTO): Promise<Projeto> {
        try {
            const { data: projeto, error } = await supabase
                .from('projetos')
                .update(data)
                .eq('id', projetoId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;

            return projeto;
        } catch (error: any) {
            throw new ProjetosServiceError(
                'Erro ao atualizar projeto',
                'UPDATE_ERROR',
                error
            );
        }
    }

    /**
     * Deleta um projeto
     */
    static async delete(projetoId: string, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('projetos')
                .delete()
                .eq('id', projetoId)
                .eq('user_id', userId);

            if (error) throw error;
        } catch (error: any) {
            throw new ProjetosServiceError(
                'Erro ao deletar projeto',
                'DELETE_ERROR',
                error
            );
        }
    }

    /**
     * Busca projetos por cliente
     */
    static async fetchByCliente(clienteId: string, userId: string): Promise<ProjetoComMetricas[]> {
        return this.fetchAllWithMetrics(userId, clienteId);
    }
}

