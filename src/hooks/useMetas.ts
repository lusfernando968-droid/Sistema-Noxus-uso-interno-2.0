import { useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Query key factory
const metasKeys = {
  all: ['metas'] as const,
  list: (userId: string) => [...metasKeys.all, 'list', userId] as const,
  progresso: (userId: string, metaId: string) => [...metasKeys.all, 'progresso', userId, metaId] as const,
};

// Função para calcular progresso de uma meta
function calcularProgresso(meta: Meta): MetaComProgresso {
  const percentual = meta.valor_meta > 0 
    ? Math.min((meta.valor_atual / meta.valor_meta) * 100, 100) 
    : 0;
  const diasRestantes = Math.ceil(
    (new Date(meta.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let statusCalculado = meta.status;
  if (diasRestantes < 0 && meta.status === 'ativa') {
    statusCalculado = 'vencida';
  } else if (diasRestantes <= 7 && meta.status === 'ativa') {
    statusCalculado = 'proxima_vencimento';
  }

  return {
    ...meta,
    percentual_progresso: percentual,
    status_calculado: statusCalculado,
    dias_restantes: diasRestantes,
    nivel_progresso: percentual >= 100 ? 'concluida' : 'em_andamento',
  };
}

// Função para buscar metas
async function fetchMetas(userId: string): Promise<MetaComProgresso[]> {
  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(calcularProgresso);
}

// Função para calcular estatísticas
function calculateStats(metasData: MetaComProgresso[]): MetasStats {
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
    metasPorPrioridade: {},
  };

  metasData.forEach(meta => {
    stats.metasPorCategoria[meta.categoria] = (stats.metasPorCategoria[meta.categoria] || 0) + 1;
    stats.metasPorPrioridade[meta.prioridade] = (stats.metasPorPrioridade[meta.prioridade] || 0) + 1;
  });

  return stats;
}

export function useMetas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query principal
  const {
    data: metas = [],
    isLoading,
    error: queryError,
    refetch: fetchMetas,
  } = useQuery({
    queryKey: metasKeys.list(user?.id || ''),
    queryFn: () => fetchMetas(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const error = queryError ? (queryError as Error).message : null;
  const metasStats = useMemo(() => calculateStats(metas), [metas]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: async (metaData: CreateMetaData): Promise<Meta> => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('metas')
        .insert([{
          ...metaData,
          user_id: user.id,
          prioridade: metaData.prioridade || 'media',
          cor: metaData.cor || '#8B5CF6',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metasKeys.all });
      toast.success('Meta criada com sucesso!');
    },
    onError: (err: Error) => {
      console.error('Erro ao criar meta:', err);
      toast.error('Erro ao criar meta');
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: string; updateData: UpdateMetaData }) => {
      const { error } = await supabase
        .from('metas')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metasKeys.all });
      toast.success('Meta atualizada com sucesso!');
    },
    onError: (err: Error) => {
      console.error('Erro ao atualizar meta:', err);
      toast.error('Erro ao atualizar meta');
    },
  });

  // Mutation para atualizar progresso
  const updateProgressoMutation = useMutation({
    mutationFn: async ({ id, novoValor }: { id: string; novoValor: number; observacao?: string }) => {
      const { error } = await supabase
        .from('metas')
        .update({ valor_atual: novoValor })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metasKeys.all });
      toast.success('Progresso atualizado com sucesso!');
    },
    onError: (err: Error) => {
      console.error('Erro ao atualizar progresso:', err);
      toast.error('Erro ao atualizar progresso');
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metasKeys.all });
      toast.success('Meta excluída com sucesso!');
    },
    onError: (err: Error) => {
      console.error('Erro ao deletar meta:', err);
      toast.error('Erro ao deletar meta');
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('realtime-metas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'metas', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: metasKeys.all });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // API compatível
  const createMeta = async (metaData: CreateMetaData): Promise<Meta | null> => {
    try {
      return await createMutation.mutateAsync(metaData);
    } catch {
      return null;
    }
  };

  const updateMeta = async (id: string, updateData: UpdateMetaData): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, updateData });
      return true;
    } catch {
      return false;
    }
  };

  const updateProgresso = async (id: string, novoValor: number, observacao?: string): Promise<boolean> => {
    try {
      await updateProgressoMutation.mutateAsync({ id, novoValor, observacao });
      return true;
    } catch {
      return false;
    }
  };

  const deleteMeta = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  // Buscar histórico de progresso
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

  // Consultas específicas (memoizadas)
  const getMetasPorCategoria = useCallback((categoria: Meta['categoria']): MetaComProgresso[] => {
    return metas.filter(meta => meta.categoria === categoria);
  }, [metas]);

  const getMetasPorStatus = useCallback((status: Meta['status']): MetaComProgresso[] => {
    return metas.filter(meta => meta.status === status);
  }, [metas]);

  const getMetasProximasVencimento = useCallback((dias: number = 7): MetaComProgresso[] => {
    return metas.filter(meta => 
      meta.status === 'ativa' && 
      meta.dias_restantes <= dias && 
      meta.dias_restantes >= 0
    );
  }, [metas]);

  const getMetasVencidas = useCallback((): MetaComProgresso[] => {
    return metas.filter(meta => meta.status_calculado === 'vencida');
  }, [metas]);

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
    fetchMetas: () => fetchMetas(),

    // Consultas específicas
    fetchProgressoHistorico,
    getMetasPorCategoria,
    getMetasPorStatus,
    getMetasProximasVencimento,
    getMetasVencidas,

    // Utilitários
    calculateStats: () => calculateStats(metas),

    // Mutations expostas
    createMutation,
    updateMutation,
    updateProgressoMutation,
    deleteMutation,
  };
}
