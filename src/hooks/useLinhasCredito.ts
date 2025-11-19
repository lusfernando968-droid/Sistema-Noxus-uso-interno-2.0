import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type LinhaCreditoRecord = {
  id?: string;
  user_id?: string;
  nome: string;
  banco_id?: string | null;
  limite: number;
  utilizado: number;
  taxa_juros?: number | null;
  modalidade: 'ROTATIVO' | 'PARCELADO' | 'CARTAO' | 'EMPRESTIMO';
  vencimento_dia?: number | null;
  data_abertura?: string | null;
  status: 'ATIVA' | 'INATIVA';
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const linhaCreditoSchema = z.object({
  nome: z.string().min(2),
  banco_id: z.string().optional().nullable().or(z.literal("")),
  limite: z.number().nonnegative().default(0),
  utilizado: z.number().nonnegative().default(0),
  taxa_juros: z.number().optional().nullable(),
  modalidade: z.enum(['ROTATIVO','PARCELADO','CARTAO','EMPRESTIMO']).default('ROTATIVO'),
  vencimento_dia: z.number().int().min(1).max(31).optional().nullable(),
  data_abertura: z.string().optional().nullable(),
  status: z.enum(['ATIVA','INATIVA']).default('ATIVA'),
  observacoes: z.string().optional().nullable(),
});

export function useLinhasCredito() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<LinhaCreditoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data, error } = await sb
        .from("linhas_credito")
        .select("*")
        .eq("user_id", user.id)
        .order("nome", { ascending: true });
      if (error) throw error;
      setItems((data || []) as any);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar linhas_credito:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar linhas", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const insert = async (payload: LinhaCreditoRecord) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = linhaCreditoSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        nome: parsed.nome,
        banco_id: parsed.banco_id || null,
        limite: Number(parsed.limite || 0),
        utilizado: Number(parsed.utilizado || 0),
        taxa_juros: parsed.taxa_juros ?? null,
        modalidade: parsed.modalidade,
        vencimento_dia: parsed.vencimento_dia ?? null,
        data_abertura: parsed.data_abertura ?? null,
        status: parsed.status,
        observacoes: parsed.observacoes ?? null,
      };
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("linhas_credito")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      setItems(prev => rows ? ([rows[0] as any, ...prev]) : prev);
      toast({ title: "Linha criada", description: "Registro salvo com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir em linhas_credito:", err);
      toast({ title: "Erro ao criar linha", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<LinhaCreditoRecord>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.limite !== undefined) merged.limite = Number(merged.limite);
      if (merged.utilizado !== undefined) merged.utilizado = Number(merged.utilizado);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("linhas_credito")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      if (rows && rows.length) {
        const updated = rows[0] as any;
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      } else {
        await fetchAll();
      }
      toast({ title: "Linha atualizada", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar linhas_credito:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { error } = await sb
        .from("linhas_credito")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Linha removida", description: "Registro excluído." });
    } catch (err: any) {
      console.error("Erro ao remover linhas_credito:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-linhas-credito")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "linhas_credito", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "linhas_credito", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.map(i => (i.id === payload.new.id ? (payload.new as any) : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "linhas_credito", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    items,
    loading,
    error,
    fetchAll,
    insert,
    update,
    remove,
  };
}

