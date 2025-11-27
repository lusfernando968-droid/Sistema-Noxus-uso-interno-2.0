import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type CampanhaStatus = 'RASCUNHO' | 'ATIVA' | 'PAUSADA' | 'ENCERRADA';
export type CampanhaCanal = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'GOOGLE_ADS' | 'ORGANICO' | 'EMAIL';
export type CampanhaEstagioFunil = 'TOPO' | 'MEIO' | 'FUNDO';

export type CampanhaRecord = {
  id?: string;
  user_id?: string;
  titulo: string;
  objetivo?: string | null;
  publico_alvo?: string | null;
  canal: CampanhaCanal;
  estagio_funil?: CampanhaEstagioFunil | null;
  orcamento?: number | null;
  data_inicio?: string | null; // yyyy-MM-dd
  data_fim?: string | null;    // yyyy-MM-dd
  status: CampanhaStatus;
  tags?: string[] | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const campanhaSchema = z.object({
  titulo: z.string().min(2),
  objetivo: z.string().optional().nullable(),
  publico_alvo: z.string().optional().nullable(),
  canal: z.enum(['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'GOOGLE_ADS', 'ORGANICO', 'EMAIL']),
  estagio_funil: z.enum(['TOPO', 'MEIO', 'FUNDO']).optional().nullable(),
  orcamento: z.number().nonnegative().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  status: z.enum(['RASCUNHO', 'ATIVA', 'PAUSADA', 'ENCERRADA']).default('RASCUNHO'),
  tags: z.array(z.string()).optional().nullable(),
  notas: z.string().optional().nullable(),
});

type ListFilters = {
  status?: CampanhaStatus | 'TODOS';
  canal?: CampanhaCanal | 'TODOS';
  periodo?: { inicio?: string; fim?: string };
  q?: string;
};

export function useCampanhas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CampanhaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListFilters>({ status: 'TODOS', canal: 'TODOS' });

  const stats = useMemo(() => {
    const porStatus = {
      RASCUNHO: items.filter(i => i.status === 'RASCUNHO').length,
      ATIVA: items.filter(i => i.status === 'ATIVA').length,
      PAUSADA: items.filter(i => i.status === 'PAUSADA').length,
      ENCERRADA: items.filter(i => i.status === 'ENCERRADA').length,
    };
    const totalOrcamento = items.reduce((s, i) => s + (Number(i.orcamento || 0)), 0);
    return { porStatus, totalOrcamento };
  }, [items]);

  const fetchAll = async (opts?: ListFilters) => {
    try {
      if (!user) return;
      setLoading(true);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      let query = sb
        .from("campanhas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const f = opts || filters;
      if (f?.status && f.status !== 'TODOS') query = query.eq('status', f.status);
      if (f?.canal && f.canal !== 'TODOS') query = query.eq('canal', f.canal);
      if (f?.periodo?.inicio) query = query.gte('data_inicio', f.periodo.inicio);
      if (f?.periodo?.fim) query = query.lte('data_fim', f.periodo.fim);
      if (f?.q) query = query.ilike('titulo', `%${f.q}%`);

      const { data, error } = await query;
      if (error) {
        if ((error as any).code === 'PGRST205' || (error as any).message?.includes('schema cache')) {
          setItems([]);
          setError('Tabela campanhas não encontrada. Aplique o schema e recarregue.');
          toast({ title: 'Campanhas indisponíveis', description: 'Tabela campanhas não existe no Supabase. Aplique a migration e recarregue.', variant: 'destructive' });
          return;
        }
        throw error;
      }
      setItems((data || []) as any);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar campanhas", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const create = async (payload: CampanhaRecord) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = campanhaSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        titulo: parsed.titulo,
        objetivo: parsed.objetivo ?? null,
        publico_alvo: parsed.publico_alvo ?? null,
        canal: parsed.canal,
        estagio_funil: parsed.estagio_funil ?? null,
        orcamento: parsed.orcamento ?? null,
        data_inicio: parsed.data_inicio ?? null,
        data_fim: parsed.data_fim ?? null,
        status: parsed.status,
        tags: parsed.tags ?? null,
        notas: parsed.notas ?? null,
      };
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("campanhas")
        .insert(toInsert)
        .select("*");
      if (error) {
        if ((error as any).code === 'PGRST205') {
          toast({ title: 'Campanhas indisponíveis', description: 'Tabela campanhas não existe no Supabase. Aplique a migration e recarregue.', variant: 'destructive' });
          throw error;
        }
        throw error;
      }
      setItems(prev => rows ? ([rows[0] as any, ...prev]) : prev);
      toast({ title: "Campanha criada", description: "Registro salvo com sucesso." });
    } catch (err: any) {
      console.error("Erro ao criar campanha:", err);
      toast({ title: "Erro ao criar", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<CampanhaRecord>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.orcamento !== undefined) merged.orcamento = Number(merged.orcamento);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("campanhas")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        if ((error as any).code === 'PGRST205') {
          toast({ title: 'Campanhas indisponíveis', description: 'Tabela campanhas não existe no Supabase. Aplique a migration e recarregue.', variant: 'destructive' });
          throw error;
        }
        throw error;
      }
      if (rows && rows.length) {
        const updated = rows[0] as any;
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      } else {
        await fetchAll();
      }
      toast({ title: "Campanha atualizada", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar campanha:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { error } = await sb
        .from("campanhas")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        if ((error as any).code === 'PGRST205') {
          toast({ title: 'Campanhas indisponíveis', description: 'Tabela campanhas não existe no Supabase. Aplique a migration e recarregue.', variant: 'destructive' });
          throw error;
        }
        throw error;
      }
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Campanha removida", description: "Registro excluído." });
    } catch (err: any) {
      console.error("Erro ao remover campanha:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const duplicate = async (id: string) => {
    const src = items.find(i => i.id === id);
    if (!src) return;
    const copy: CampanhaRecord = {
      titulo: `${src.titulo} (cópia)`,
      objetivo: src.objetivo ?? null,
      publico_alvo: src.publico_alvo ?? null,
      canal: src.canal,
      orcamento: src.orcamento ?? null,
      data_inicio: src.data_inicio ?? null,
      data_fim: src.data_fim ?? null,
      status: 'RASCUNHO',
      tags: src.tags ?? null,
      notas: src.notas ?? null,
    };
    await create(copy);
  };

  const setStatus = async (id: string, status: CampanhaStatus) => {
    await update(id, { status });
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-campanhas")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "campanhas", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campanhas", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.map(i => (i.id === (payload.new as any).id ? (payload.new as any) : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "campanhas", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.filter(i => i.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    items,
    stats,
    filters,
    setFilters,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
    duplicate,
    setStatus,
  };
}
