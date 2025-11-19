import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type BancoRecord = {
  id: string;
  codigo: string;
  nome: string;
  nome_curto: string;
  cor_primaria: string;
  cor_secundaria: string;
  logo_url?: string | null;
  site_url?: string | null;
  ativo?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContaBancariaRecord = {
  id?: string;
  user_id?: string;
  nome: string;
  banco?: string | null; // Campo legado - será removido futuramente
  banco_id?: string | null;
  agencia?: string | null;
  numero?: string | null;
  tipo?: string | null; // corrente, poupanca, etc.
  moeda?: string; // BRL por padrão
  saldo_inicial?: number; // 0 por padrão
  is_arquivada?: boolean;
  arquivado_em?: string | null;
  created_at?: string;
  updated_at?: string;
  // Dados do banco (join)
  banco_detalhes?: BancoRecord | null;
};

export const contaBancariaSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  banco: z.string().optional(), // Campo legado
  banco_id: z.string().uuid().optional(),
  agencia: z.string().optional(),
  numero: z.string().optional(),
  tipo: z.string().optional(),
  moeda: z.string().default("BRL"),
  saldo_inicial: z
    .number({ invalid_type_error: "Saldo inicial deve ser numérico" })
    .nonnegative("Saldo inicial não pode ser negativo")
    .default(0),
});

export function useContasBancarias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ContaBancariaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async (opts?: { incluirArquivadas?: boolean }) => {
    try {
      if (!user) return;
      setLoading(true);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      let query = sb
        .from("contas_bancarias")
        .select(`
          *,
          banco_detalhes:bancos(*)
        `)
        .eq("user_id", user.id)
        .order("nome", { ascending: true });
      
      if (!opts?.incluirArquivadas) query = query.eq("is_arquivada", false);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Transformar dados para incluir banco_detalhes corretamente
      const contasComBanco = (data || []).map((conta: any) => ({
        ...conta,
        banco_detalhes: conta.banco_detalhes || null
      }));
      
      setItems(contasComBanco);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar contas_bancarias:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar contas", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const insert = async (payload: ContaBancariaRecord) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = contaBancariaSchema.parse(payload);
      const toInsert: any = {
        ...parsed,
        user_id: user.id,
        banco: parsed.banco ?? null,
        banco_id: parsed.banco_id ?? null,
        agencia: parsed.agencia ?? null,
        numero: parsed.numero ?? null,
        tipo: parsed.tipo ?? null,
      };
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("contas_bancarias")
        .insert(toInsert)
        .select(`*, banco_detalhes:bancos(*)`);
      
      if (error) throw error;
      
      if (rows && rows.length) {
        const novaConta = {
          ...rows[0],
          banco_detalhes: rows[0].banco_detalhes || null
        };
        setItems(prev => [novaConta, ...prev]);
      } else {
        await fetchAll();
      }
      
      toast({ title: "Conta criada", description: "Conta bancária salva com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir em contas_bancarias:", err);
      toast({ title: "Erro ao criar conta", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<ContaBancariaRecord>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.saldo_inicial !== undefined) merged.saldo_inicial = Number(merged.saldo_inicial);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("contas_bancarias")
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
      toast({ title: "Conta atualizada", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar contas_bancarias:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const archive = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("contas_bancarias")
        .update({ is_arquivada: true, arquivado_em: new Date().toISOString() })
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      if (rows && rows.length) {
        const updated = rows[0] as any;
        setItems(prev => prev.filter(i => i.id !== updated.id));
      } else {
        setItems(prev => prev.filter(i => i.id !== id));
      }
      toast({ title: "Conta arquivada", description: "A conta foi arquivada." });
    } catch (err: any) {
      console.error("Erro ao arquivar conta:", err);
      toast({ title: "Erro ao arquivar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-contas-bancarias")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contas_bancarias", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const novo = payload.new as any;
          if (!novo?.is_arquivada) setItems(prev => [novo, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contas_bancarias", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const atualizado = payload.new as any;
          setItems(prev => {
            if (atualizado?.is_arquivada) return prev.filter(i => i.id !== atualizado.id);
            return prev.map(i => (i.id === atualizado.id ? atualizado : i));
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "contas_bancarias", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems(prev => prev.filter(i => i.id !== (payload.old as any)?.id));
        }
      )
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
    archive,
  };
}

export const TIPOS_CONTA = [
  "Corrente",
  "Poupança",
  "Salário",
  "Investimento",
  "Outros",
];

export const MOEDAS = [
  "BRL",
  "USD",
  "EUR",
];
