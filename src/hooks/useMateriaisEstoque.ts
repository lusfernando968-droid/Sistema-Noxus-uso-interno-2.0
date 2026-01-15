import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TransacoesService } from "@/services/transacoes.service";

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
  data_esgotamento?: string | null;
  financeiro_id?: string | null;
  // Campos de conversão de unidades
  unidade_embalagem?: string | null;
  fator_conversao?: number | null;
  quantidade_embalagens?: number | null;
  created_at?: string;
  updated_at?: string;
};

const parseNumberLocale = (v: any) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const trimmed = v.trim();

    // Se tem vírgula, assume formato brasileiro (1.234,56)
    if (trimmed.includes(',')) {
      // Remove pontos (separador de milhar) e substitui vírgula por ponto
      const s = trimmed.replace(/\./g, "").replace(",", ".");
      const n = Number(s);
      return Number.isNaN(n) ? undefined : n;
    }

    // Se não tem vírgula, trata ponto como decimal (formato inglês: 1234.56 ou 1,234.56)
    const s = trimmed.replace(/,/g, ""); // Remove vírgulas (separador de milhar)
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
  // Campos de conversão de unidades (opcionais)
  unidade_embalagem: z.string().optional().nullable(),
  fator_conversao: z.preprocess(parseNumberLocale, z.number().positive().optional()).optional().nullable(),
  quantidade_embalagens: z.preprocess(parseNumberLocale, z.number().nonnegative().optional()).optional().nullable(),
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

  const insert = async (payload: MaterialRecord, options?: { lancarFinanceiro?: boolean }) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = materialSchema.parse(payload);

      let financeiroId: string | null = null;

      // 1. Lançar no financeiro se solicitado usando o serviço correto
      if (options?.lancarFinanceiro) {
        try {
          const valorTotal = parsed.quantidade * parsed.custo_unitario;

          console.log("🔵 Tentando criar transação financeira:", {
            tipo: "DESPESA",
            categoria: "Material",
            valor: valorTotal,
            data_vencimento: parsed.data_aquisicao,
            descricao: `Compra de material: ${parsed.nome}`,
          });

          const result = await TransacoesService.create(user.id, {
            tipo: "DESPESA",
            categoria: "Material",
            valor: valorTotal,
            data_vencimento: parsed.data_aquisicao,
            descricao: `Compra de material: ${parsed.nome}`,
            data_liquidacao: parsed.data_aquisicao, // Marca como pago
          });

          console.log("🟢 Resultado do TransacoesService.create:", result);

          if (result.success) {
            // Buscar o ID da transação criada
            const { data: transacoes, error: searchError } = await sb
              .from("transacoes")
              .select("id")
              .eq("user_id", user.id)
              .eq("descricao", `Compra de material: ${parsed.nome}`)
              .eq("valor", valorTotal)
              .order("created_at", { ascending: false })
              .limit(1);

            console.log("🔍 Busca de transação criada:", { transacoes, searchError });

            if (transacoes && transacoes.length > 0) {
              financeiroId = transacoes[0].id;
              console.log("✅ Transação vinculada com ID:", financeiroId);
            } else {
              console.warn("⚠️ Transação criada mas não encontrada na busca");
            }
          } else {
            console.error("❌ TransacoesService retornou success=false");
          }
        } catch (finError: any) {
          console.error("❌ ERRO COMPLETO ao lançar financeiro:", finError);
          console.error("❌ Stack trace:", finError.stack);
          console.error("❌ Detalhes do erro:", JSON.stringify(finError, null, 2));

          toast({
            title: "Erro ao criar despesa",
            description: `${finError.message || finError.code || 'Erro desconhecido'}. Verifique o console (F12).`,
            variant: "destructive",
            duration: 10000
          });
        }
      }

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
        financeiro_id: financeiroId,
        unidade_embalagem: parsed.unidade_embalagem ?? null,
        fator_conversao: parsed.fator_conversao ?? null,
        quantidade_embalagens: parsed.quantidade_embalagens ?? null,
      };

      console.log('💾 Inserindo no banco:', { custo_unitario: toInsert.custo_unitario, tipo: typeof toInsert.custo_unitario });

      const { data: rows, error } = await sb
        .from("estoque_materiais")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      setItems(prev => rows ? ([rows[0] as any, ...prev]) : prev);

      if (financeiroId) {
        toast({ title: "Sucesso!", description: "Material cadastrado e despesa lançada no financeiro." });
      } else {
        toast({ title: "Material adicionado", description: "Item cadastrado com sucesso." });
      }
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

  const darBaixa = async (id: string, dataEsgotamento: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: rows, error } = await sb
        .from("estoque_materiais")
        .update({ data_esgotamento: dataEsgotamento })
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*");

      if (error) throw error;

      if (rows && rows.length) {
        const updated = rows[0] as any;
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));

        // Calcular duração
        const dataCompra = new Date(updated.data_aquisicao);
        const dataFim = new Date(dataEsgotamento);
        const diffTime = Math.abs(dataFim.getTime() - dataCompra.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        toast({ title: "Material baixado", description: `Duração registrada: ${diffDays} dias.` });
      }
    } catch (err: any) {
      console.error("Erro ao dar baixa:", err);
      toast({ title: "Erro ao dar baixa", description: err.message, variant: "destructive" });
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

  return { items, loading, error, fetchAll, insert, update, remove, darBaixa };
}
