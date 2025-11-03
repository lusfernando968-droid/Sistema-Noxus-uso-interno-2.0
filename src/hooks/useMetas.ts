import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Meta {
  id: string;
  user_id: string;
  titulo: string;
  descricao?: string;
  categoria: 'financeiro' | 'clientes' | 'projetos' | 'vendas' | 'pessoal' | 'operacional';
  tipo: 'valor' | 'quantidade' | 'percentual';
  valor_meta: number;
  valor_atual: number;
  unidade: string;
  data_inicio: string;
  data_fim: string;
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  cor: string;
  created_at: string;
  updated_at: string;
}

export interface MetaComProgresso extends Meta {
  percentual_progresso: number;
  status_calculado: string;
  dias_restantes: number;
  nivel_progresso: string;
}

export interface MetaProgresso {
  id: string;
  meta_id: string;
  valor_anterior: number;
  valor_novo: number;
  percentual_anterior: number;
  percentual_novo: number;
  observacao?: string;
  data_registro: string;
  user_id: string;
}

export interface MetaAlerta {
  id: string;
  meta_id: string;
  tipo_alerta: 'prazo' | 'progresso' | 'conclusao' | 'inatividade';
  percentual_trigger?: number;
  dias_antes_prazo?: number;
  ativo: boolean;
  created_at: string;
}

export interface CreateMetaData {
  titulo: string;
  descricao?: string;
  categoria: Meta['categoria'];
  tipo: Meta['tipo'];
  valor_meta: number;
  unidade: string;
  data_inicio: string;
  data_fim: string;
  prioridade?: Meta['prioridade'];
  cor?: string;
}

export interface UpdateMetaData extends Partial<CreateMetaData> {
  valor_atual?: number;
  status?: Meta['status'];
}

export interface MetasStats {
  total: number;
  ativas: number;
  concluidas: number;
  vencidas: number;
  proximasVencimento: number;
  progressoMedio: number;
  metasPorCategoria: Record<string, number>;
  metasPorPrioridade: Record<string, number>;
}

export function useMetas() {
  const [metas, setMetas] = useState<MetaComProgresso[]>([]);
  const [metasStats, setMetasStats] = useState<MetasStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Buscar todas as metas do usuário
  const fetchMetas = useCallback(async () => {
    if (!user) {
      setMetas([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Calcular progresso manualmente
      const metasComProgresso = data?.map(meta => ({
        ...meta,
        percentual_progresso: meta.valor_meta > 0 ? Math.min((meta.valor_atual / meta.valor_meta) * 100, 100) : 0,
        status_calculado: meta.status,
        dias_restantes: Math.ceil((new Date(meta.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        nivel_progresso: meta.valor_meta > 0 && (meta.valor_atual / meta.valor_meta) * 100 >= 100 ? 'concluida' : 'em_andamento'
      })) || [];

      setMetas(metasComProgresso);
      calculateStats(metasComProgresso);

    } catch (err) {
      console.error('Erro ao buscar metas:', err);
      setError('Erro ao carregar metas');
      toast.error('Erro ao carregar metas.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Calcular estatísticas das metas
  const calculateStats = (metasData: MetaComProgresso[]) => {
    const stats: MetasStats = {
      total: metasData.length,
      ativas: metasData.filter(m => m.status === 'ativa').length,
      concluidas: metasData.filter(m => m.status === 'concluida' || m.percentual_progresso >= 100).length,
      vencidas: metasData.filter(m => m.status_calculado === 'vencida').length,
      proximasVencimento: metasData.filter(m => m.status_calculado === 'proxima_vencimento').length,
      progressoMedio: metasData.length > 0 
        ? metasData.reduce((sum, m) => sum + m.percentual_progresso, 0) / metasData.length 
        : 0,
      metasPorCategoria: {},
      metasPorPrioridade: {}
    };

    // Contar por categoria
    metasData.forEach(meta => {
      stats.metasPorCategoria[meta.categoria] = (stats.metasPorCategoria[meta.categoria] || 0) + 1;
      stats.metasPorPrioridade[meta.prioridade] = (stats.metasPorPrioridade[meta.prioridade] || 0) + 1;
    });

    setMetasStats(stats);
  };

  // Criar nova meta
  const createMeta = async (metaData: CreateMetaData): Promise<Meta | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error: createError } = await supabase
        .from('metas')
        .insert([{
          ...metaData,
          user_id: user.id,
          prioridade: metaData.prioridade || 'media',
          cor: metaData.cor || '#8B5CF6'
        }])
        .select()
        .single();

      if (createError) throw createError;

      toast.success('Meta criada com sucesso!');
      await fetchMetas();
      return data;
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      toast.error('Erro ao criar meta');
      return null;
    }
  };

  // Atualizar meta existente
  const updateMeta = async (id: string, updateData: UpdateMetaData): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('metas')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast.success('Meta atualizada com sucesso!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
      toast.error('Erro ao atualizar meta');
      return false;
    }
  };

  // Atualizar progresso da meta
  const updateProgresso = async (id: string, novoValor: number, observacao?: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('metas')
        .update({ valor_atual: novoValor })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast.success('Progresso atualizado com sucesso!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
      toast.error('Erro ao atualizar progresso');
      return false;
    }
  };

  // Deletar meta
  const deleteMeta = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('metas')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      toast.success('Meta excluída com sucesso!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Erro ao deletar meta:', err);
      toast.error('Erro ao deletar meta');
      return false;
    }
  };

  // Buscar histórico de progresso de uma meta
  const fetchProgressoHistorico = async (metaId: string): Promise<MetaProgresso[]> => {
    try {
      const { data, error } = await supabase
        .from('meta_progresso')
        .select('*')
        .eq('meta_id', metaId)
        .eq('user_id', user?.id)
        .order('data_registro', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      return [];
    }
  };

  // Buscar metas por categoria
  const getMetasPorCategoria = (categoria: Meta['categoria']): MetaComProgresso[] => {
    return metas.filter(meta => meta.categoria === categoria);
  };

  // Buscar metas por status
  const getMetasPorStatus = (status: Meta['status']): MetaComProgresso[] => {
    return metas.filter(meta => meta.status === status);
  };

  // Buscar metas próximas do vencimento
  const getMetasProximasVencimento = (dias: number = 7): MetaComProgresso[] => {
    return metas.filter(meta => 
      meta.status === 'ativa' && 
      meta.dias_restantes <= dias && 
      meta.dias_restantes >= 0
    );
  };

  // Buscar metas vencidas
  const getMetasVencidas = (): MetaComProgresso[] => {
    return metas.filter(meta => meta.status_calculado === 'vencida');
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  return {
    // Estados
    metas,
    metasStats,
    isLoading,
    error,

    // Ações CRUD
    createMeta,
    updateMeta,
    updateProgresso,
    deleteMeta,
    fetchMetas,

    // Consultas específicas
    fetchProgressoHistorico,
    getMetasPorCategoria,
    getMetasPorStatus,
    getMetasProximasVencimento,
    getMetasVencidas,

    // Utilitários
    calculateStats
  };
}