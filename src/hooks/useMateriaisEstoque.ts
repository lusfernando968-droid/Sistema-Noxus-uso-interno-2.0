import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type MaterialRecord = {
  id?: string;
  user_id?: string;
  data_aquisicao: string; // yyyy-MM-dd
  tipo_material: string;
  nome: string;
  marca?: string | null;
  fornecedor?: string | null;
  quantidade: number;
  unidade: string;
  custo_unitario: number;
  valor_total?: number;
  lote?: string | null;
  validade?: string | null; // yyyy-MM-dd
  local_armazenamento?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
};

const parseNumberLocale = (v: any) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim().replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
};

export const materialSchema = z.object({
  data_aquisicao: z.string().min(1),
  tipo_material: z.string().min(1),
  nome: z.string().min(2),
  marca: z.string().optional().nullable(),
  fornecedor: z.string().optional().nullable(),
  quantidade: z.preprocess(parseNumberLocale, z.number().nonnegative()),
  unidade: z.string().min(1),
  custo_unitario: z.preprocess(parseNumberLocale, z.number().nonnegative()),
  lote: z.string().optional().nullable(),
  validade: z.string().optional().nullable(),
  local_armazenamento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export function useMateriaisEstoque() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<MaterialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;

  const fetchAll = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const { data, error } = await sb
        .from("estoque_materiais")
        .select("*")
        .eq("user_id", user.id)
        .order("data_aquisicao", { ascending: false });
      if (error) throw error;
      setItems((data || []) as any);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar estoque_materiais:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar materiais", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const insert = async (payload: MaterialRecord) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = materialSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        data_aquisicao: parsed.data_aquisicao,
        tipo_material: parsed.tipo_material,
        nome: parsed.nome,
        marca: parsed.marca ?? null,
        fornecedor: parsed.fornecedor ?? null,
        quantidade: parsed.quantidade,
        unidade: parsed.unidade,
        custo_unitario: parsed.custo_unitario,
        lote: parsed.lote ?? null,
        validade: parsed.validade ?? null,
        local_armazenamento: parsed.local_armazenamento ?? null,
        observacoes: parsed.observacoes ?? null,
      };
      const { data: rows, error } = await sb
        .from("estoque_materiais")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      setItems(prev => rows ? ([rows[0] as any, ...prev]) : prev);
      toast({ title: "Material adicionado", description: "Item cadastrado com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir em estoque_materiais:", err);
      toast({ title: "Erro ao adicionar", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<MaterialRecord>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.quantidade !== undefined) merged.quantidade = parseNumberLocale(merged.quantidade);
      if (merged.custo_unitario !== undefined) merged.custo_unitario = parseNumberLocale(merged.custo_unitario);
      const { data: rows, error } = await sb
        .from("estoque_materiais")
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
      toast({ title: "Material atualizado", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar estoque_materiais:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await sb
        .from("estoque_materiais")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Material removido", description: "Item excluído do estoque." });
    } catch (err: any) {
      console.error("Erro ao remover estoque_materiais:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const channel = sb
      .channel("realtime-estoque_materiais")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "estoque_materiais", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "estoque_materiais", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.map(i => (i.id === payload.new.id ? (payload.new as any) : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "estoque_materiais", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { items, loading, error, fetchAll, insert, update, remove };
}
