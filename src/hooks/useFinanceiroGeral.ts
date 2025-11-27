import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type FinanceiroGeralRecord = {
  id?: string;
  user_id?: string;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  forma_pagamento: string;
  tipo: 'entrada' | 'saida';
  comprovante?: string | null;
  observacoes?: string | null;
  conta_id?: string | null;
  created_at?: string;
  updated_at?: string;
  origem?: string | null;
  origem_id?: string | null;
  setor?: string | null;
  readOnly?: boolean;
  editLink?: string | null;
  agendamento_id?: string | null;
  cliente_nome?: string;
};

export const financeiroGeralSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().min(2, "Descrição muito curta"),
  valor: z
    .number({ invalid_type_error: "Valor deve ser numérico" })
    .nonnegative("Valor não pode ser negativo"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  tipo: z.enum(["entrada", "saida"], { errorMap: () => ({ message: "Tipo deve ser entrada ou saída" }) }),
  comprovante: z.string().url().optional().or(z.literal("")),
  observacoes: z.string().optional(),
  conta_id: z.string().uuid().optional(),
});

export type FinanceiroStats = {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  porCategoriaEntradas: Record<string, number>;
  porCategoriaSaidas: Record<string, number>;
};

function calcularStats(rows: FinanceiroGeralRecord[]): FinanceiroStats {
  const entradas = rows.filter(r => r.tipo === 'entrada');
  const saidas = rows.filter(r => r.tipo === 'saida');

  const totalEntradas = entradas.reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
  const totalSaidas = saidas.reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
  const saldo = totalEntradas - totalSaidas;

  const porCategoriaEntradas: Record<string, number> = {};
  const porCategoriaSaidas: Record<string, number> = {};

  for (const r of entradas) {
    const cat = r.categoria || "Outros";
    porCategoriaEntradas[cat] = (porCategoriaEntradas[cat] || 0) + (Number(r.valor) || 0);
  }

  for (const r of saidas) {
    const cat = r.categoria || "Outros";
    porCategoriaSaidas[cat] = (porCategoriaSaidas[cat] || 0) + (Number(r.valor) || 0);
  }

  return { totalEntradas, totalSaidas, saldo, porCategoriaEntradas, porCategoriaSaidas };
}

export function useFinanceiroGeral() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<FinanceiroGeralRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => calcularStats(items), [items]);

  const fetchAll = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data, error } = await sb
        .from("financeiro_geral")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });
      if (error) throw error;
      const converted = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        data: item.data,
        descricao: item.descricao,
        valor: Number(item.valor),
        categoria: item.categoria,
        forma_pagamento: item.forma_pagamento,
        tipo: item.tipo,
        comprovante: item.comprovante,
        observacoes: item.observacoes,
        conta_id: item.conta_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        origem: item.origem,
        origem_id: item.origem_id,
        setor: item.setor,
        readOnly: !!item.origem,
        editLink: item.origem === 'financeiro_tattoo' && item.origem_id ? `/tattoo-financeiro?id=${item.origem_id}` : null,
        agendamento_id: item.agendamento_id,
      }));

      // Resolve client names for records with agendamento_id
      const agendamentoIds = converted
        .filter((i: any) => i.agendamento_id)
        .map((i: any) => i.agendamento_id);

      if (agendamentoIds.length > 0) {
        const { data: agendamentosData } = await sb
          .from('agendamentos')
          .select('id, projeto_id')
          .in('id', agendamentoIds);

        if (agendamentosData && agendamentosData.length > 0) {
          const projetoIds = agendamentosData.map((a: any) => a.projeto_id).filter(Boolean);

          if (projetoIds.length > 0) {
            const { data: projetosData } = await sb
              .from('projetos')
              .select('id, cliente_id')
              .in('id', projetoIds);

            if (projetosData && projetosData.length > 0) {
              const clienteIds = projetosData.map((p: any) => p.cliente_id).filter(Boolean);

              if (clienteIds.length > 0) {
                const { data: clientesData } = await sb
                  .from('clientes')
                  .select('id, nome')
                  .in('id', clienteIds);

                // Map everything back
                const clienteMap = new Map(clientesData?.map((c: any) => [c.id, c.nome]));
                const projetoMap = new Map(projetosData?.map((p: any) => [p.id, p.cliente_id]));
                const agendamentoMap = new Map(agendamentosData?.map((a: any) => [a.id, a.projeto_id]));

                converted.forEach((item: any) => {
                  if (item.agendamento_id) {
                    const projId = agendamentoMap.get(item.agendamento_id);
                    if (projId) {
                      const cliId = projetoMap.get(projId);
                      if (cliId) {
                        item.cliente_nome = clienteMap.get(cliId);
                      }
                    }
                  }
                });
              }
            }
          }
        }
      }

      setItems(converted);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar financeiro_geral:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar dados", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const insert = async (payload: FinanceiroGeralRecord) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = financeiroGeralSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        data: parsed.data,
        descricao: parsed.descricao,
        valor: parsed.valor,
        categoria: parsed.categoria,
        forma_pagamento: parsed.forma_pagamento,
        tipo: parsed.tipo,
        comprovante: parsed.comprovante || null,
        observacoes: parsed.observacoes || null,
        conta_id: parsed.conta_id || null,
      };

      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("financeiro_geral")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      if (rows && rows.length) {
        const r: any = rows[0];
        const newRecord: FinanceiroGeralRecord = {
          id: r.id,
          user_id: r.user_id,
          data: r.data,
          descricao: r.descricao,
          valor: Number(r.valor),
          categoria: r.categoria,
          forma_pagamento: r.forma_pagamento,
          tipo: r.tipo,
          comprovante: r.comprovante,
          observacoes: r.observacoes,
          conta_id: r.conta_id,
          created_at: r.created_at,
          updated_at: r.updated_at,
          origem: r.origem,
          origem_id: r.origem_id,
          setor: r.setor,
          readOnly: !!r.origem,
          editLink: r.origem === 'financeiro_tattoo' && r.origem_id ? `/tattoo-financeiro?id=${r.origem_id}` : null,
        };
        setItems(prev => [newRecord, ...prev]);
      } else {
        await fetchAll();
      }
      toast({ title: "Registro criado", description: "Financeiro Tattoo salvo com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir em financeiro_geral:", err);
      toast({ title: "Erro ao criar registro", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<FinanceiroGeralRecord>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.valor !== undefined) merged.valor = Number(merged.valor);
      if (merged.comprovante === "") merged.comprovante = null;
      if (merged.data !== undefined) merged.data = merged.data;
      if (merged.tipo !== undefined) merged.tipo = merged.tipo;
      if (merged.conta_id === "") merged.conta_id = null as any;
      delete merged.user_id;

      const local = items.find(i => i.id === id);
      if (local?.origem) throw new Error("Registro sincronizado (Tattoo) é somente leitura. Edite no módulo Tattoo.");

      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("financeiro_geral")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .is("origem", null);
      if (error) throw error;

      if (rows && rows.length) {
        const r: any = rows[0];
        const updated: FinanceiroGeralRecord = {
          id: r.id,
          user_id: r.user_id,
          data: r.data,
          descricao: r.descricao,
          valor: Number(r.valor),
          categoria: r.categoria,
          forma_pagamento: r.forma_pagamento,
          tipo: r.tipo,
          comprovante: r.comprovante,
          observacoes: r.observacoes,
          conta_id: r.conta_id,
          created_at: r.created_at,
          updated_at: r.updated_at,
          origem: r.origem,
          origem_id: r.origem_id,
          setor: r.setor,
          readOnly: !!r.origem,
          editLink: r.origem === 'financeiro_tattoo' && r.origem_id ? `/tattoo-financeiro?id=${r.origem_id}` : null,
        };
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      } else {
        await fetchAll();
      }
      toast({ title: "Registro atualizado", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar financeiro_geral:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const local = items.find(i => i.id === id);
      if (local?.origem) throw new Error("Registro sincronizado (Tattoo) é somente leitura. Exclua no módulo Tattoo.");
      const { error } = await sb
        .from("financeiro_geral")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .is("origem", null);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Registro removido", description: "Financeiro Tattoo excluído." });
    } catch (err: any) {
      console.error("Erro ao remover financeiro_geral:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-financeiro_geral")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "financeiro_geral", filter: `user_id=eq.${user.id}` }, (payload) => {
        const r: any = payload.new;
        const newRecord: FinanceiroGeralRecord = {
          id: r.id,
          user_id: r.user_id,
          data: r.data,
          descricao: r.descricao,
          valor: Number(r.valor),
          categoria: r.categoria,
          forma_pagamento: r.forma_pagamento,
          tipo: r.tipo,
          comprovante: r.comprovante,
          observacoes: r.observacoes,
          created_at: r.created_at,
          updated_at: r.updated_at,
          origem: r.origem,
          origem_id: r.origem_id,
          setor: r.setor,
          readOnly: !!r.origem,
          editLink: r.origem === 'financeiro_tattoo' && r.origem_id ? `/tattoo-financeiro?id=${r.origem_id}` : null,
        };
        setItems(prev => [newRecord, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "financeiro_geral", filter: `user_id=eq.${user.id}` }, (payload) => {
        const r: any = payload.new;
        const updatedRecord: FinanceiroGeralRecord = {
          id: r.id,
          user_id: r.user_id,
          data: r.data,
          descricao: r.descricao,
          valor: Number(r.valor),
          categoria: r.categoria,
          forma_pagamento: r.forma_pagamento,
          tipo: r.tipo,
          comprovante: r.comprovante,
          observacoes: r.observacoes,
          created_at: r.created_at,
          updated_at: r.updated_at,
          origem: r.origem,
          origem_id: r.origem_id,
          setor: r.setor,
          readOnly: !!r.origem,
          editLink: r.origem === 'financeiro_tattoo' && r.origem_id ? `/tattoo-financeiro?id=${r.origem_id}` : null,
        };
        setItems(prev => prev.map(i => (i.id === updatedRecord.id ? updatedRecord : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "financeiro_geral", filter: `user_id=eq.${user.id}` }, (payload) => {
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
    loading,
    error,
    fetchAll,
    insert,
    update,
    remove,
  };
}

export const CATEGORIAS_GERAIS = [
  "Vendas",
  "Serviços Prestados",
  "Aluguel",
  "Investimento",
  "Outras Entradas",
  "Aluguel (Despesa)",
  "Contas",
  "Materiais",
  "Marketing",
  "Impostos",
  "Salários",
  "Serviços",
  "Manutenção",
  "Outras Despesas",
];

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Cartão",
  "Pix",
  "Transferência",
  "Boleto",
  "Outros",
];
