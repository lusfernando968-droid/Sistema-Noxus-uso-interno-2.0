import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle2, TrendingUp, TrendingDown, Filter, Trash2, Calendar, DollarSign, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialCalendar } from "@/components/calendar/FinancialCalendar";
import BankBalanceWidget from "@/components/financeiro/BankBalanceWidget";
import { calcularSaldoConta, saldoPosTransacao } from "@/utils/saldoPorConta";
import TabelaGestaoBancos from "@/components/financeiro/TabelaGestaoBancos";
import { useCarteira } from "@/hooks/useCarteira";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";


type TipoTransacao = "RECEITA" | "DESPESA" | "APORTE";

interface Transacao {
  id: string;
  tipo: TipoTransacao;
  categoria: string;
  valor: number;
  data_vencimento: string;
  data_liquidacao: string | null;
  descricao: string;
  agendamento_id: string | null;
  agendamentos?: {
    titulo: string;
  };
  conta_id?: string | null;
}

interface Agendamento {
  id: string;
  titulo: string;
  data: string;
  projetos?: {
    clientes?: {
      nome: string;
    } | null;
  } | null;
}

const CATEGORIAS_RECEITA = [
  "Pagamento de Cliente",
  "Adiantamento",
  "Projeto Concluído",
  "Consultoria",
  "Manutenção",
  "Outros"
];

const CATEGORIAS_DESPESA = [
  "Fornecedor",
  "Salário",
  "Infraestrutura",
  "Marketing",
  "Equipamento",
  "Material",
  "Outros"
];



const Financeiro = () => {
  // Set document title
  useEffect(() => {
    document.title = "Financeiro Tattoo - Noxus";
  }, []);
  const { user } = useAuth();
  const { items: contas } = useContasBancarias();
  const { items: carteiraItems } = useCarteira();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLiquidarOpen, setIsLiquidarOpen] = useState(false);
  const [liquidarTargetId, setLiquidarTargetId] = useState<string | null>(null);
  const [liquidarContaId, setLiquidarContaId] = useState<string>("");
  const [liquidarData, setLiquidarData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoTransacao>("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "LIQUIDADAS" | "PENDENTES">("TODOS");
  const [filtroContaId, setFiltroContaId] = useState<string>("TODAS");
  const [formData, setFormData] = useState({
    tipo: "RECEITA" as TipoTransacao,
    categoria: "",
    valor: "",
    data_vencimento: "",
    descricao: "",
    agendamento_id: "",
    liquidarFuturo: true,
    conta_id: "",
    conta_destino_id: "",
  });

  const contaSelecionadaId = formData.conta_id || "";
  const saldoConta = calcularSaldoConta(contaSelecionadaId, contas, carteiraItems as any);
  const previewSaldoPos = saldoPosTransacao(
    Number(saldoConta.saldoAtual || 0),
    formData.tipo,
    Number(parseFloat(formData.valor || "0") || 0),
    true
  );

  const formatCurrencyBR = (value: string) => {
    if (value === "") return "";
    const num = Number(value);
    if (!isFinite(num)) return "";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleValorChange = (e: any) => {
    const digitsOnly = String(e.target.value).replace(/\D/g, "");
    if (!digitsOnly) {
      setFormData({ ...formData, valor: "" });
      return;
    }
    const cents = parseInt(digitsOnly, 10);
    const value = (cents / 100).toFixed(2);
    setFormData({ ...formData, valor: value });
  };

  useEffect(() => {
    if (user) {
      fetchTransacoes();
      fetchAgendamentos();
    }
  }, [user]);

  const fetchTransacoes = async () => {
    const { data, error } = await supabase
      .from("transacoes")
      .select(`
        *,
        agendamentos (
          titulo
        )
      `)
      .order("data_vencimento", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar transações");
      console.error(error);
    } else {
      setTransacoes(data?.map(t => ({
        ...t,
        tipo: t.tipo as TipoTransacao
      })) || []);
      try {
        const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
        const list = (data || []).filter((t: any) => !!t.data_liquidacao && !!t.conta_id);
        for (const t of list) {
          const filtro: any = {
            user_id: t.user_id,
            descricao: t.descricao,
            valor: t.valor,
            categoria: t.categoria,
            data_vencimento: t.data_vencimento,
            conta_id: t.conta_id,
            data_liquidacao: t.data_liquidacao,
          };
          const { data: exists } = await sb
            .from("financeiro_tattoo")
            .select("id")
            .match(filtro)
            .limit(1);
          if (!exists || !exists.length) {
            await sb.from("financeiro_tattoo").insert({
              user_id: t.user_id,
              tipo: t.tipo,
              categoria: t.categoria,
              valor: Number(t.valor || 0),
              data_vencimento: t.data_vencimento,
              descricao: t.descricao,
              agendamento_id: t.agendamento_id || null,
              data_liquidacao: t.data_liquidacao,
              conta_id: t.conta_id,
            });
          }
        }
      } catch (_) { }
    }
  };

  const fetchAgendamentos = async () => {
    const { data, error } = await supabase
      .from("agendamentos")
      .select(`
        id, 
        titulo, 
        data,
        projetos (
          clientes (
            nome
          )
        )
      `)
      .order("data", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setAgendamentos(data || []);
    }
  };

  const ensureCarteiraSync = async (id: string) => {
    try {
      const { data: t, error: e1 } = await supabase
        .from("transacoes")
        .select("*")
        .eq("id", id)
        .single();
      if (e1 || !t) return;
      if (!t.data_liquidacao || !t.conta_id) return;
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const filtro = {
        user_id: t.user_id,
        descricao: t.descricao,
        valor: t.valor,
        categoria: t.categoria,
        data_vencimento: t.data_vencimento,
        conta_id: t.conta_id,
        data_liquidacao: t.data_liquidacao,
      } as any;
      const { data: existe, error: e2 } = await sb
        .from("financeiro_tattoo")
        .select("id")
        .match(filtro)
        .limit(1);
      if (e2) return;
      if (existe && existe.length) return;
      const payload = {
        user_id: t.user_id,
        tipo: t.tipo,
        categoria: t.categoria,
        valor: Number(t.valor || 0),
        data_vencimento: t.data_vencimento,
        descricao: t.descricao,
        agendamento_id: t.agendamento_id || null,
        data_liquidacao: t.data_liquidacao,
        conta_id: t.conta_id,
      };
      await sb.from("financeiro_tattoo").insert(payload);
    } catch (_) { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (isEditMode && editingId) {
      const updatePayload = {
        tipo: formData.tipo,
        categoria: formData.categoria,
        valor: parseFloat(formData.valor),
        data_vencimento: formData.data_vencimento,
        descricao: formData.descricao,
        agendamento_id: formData.agendamento_id || null,
        conta_id: formData.conta_id || null,
      };

      const { error } = await supabase
        .from("transacoes")
        .update(updatePayload)
        .eq("id", editingId);

      if (error) {
        const msg = String(error.message || "");
        const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");
        if (isSchemaCacheConta) {
          const retryPayload: any = { ...updatePayload };
          delete retryPayload.conta_id;
          const { error: errRetry } = await supabase
            .from("transacoes")
            .update(retryPayload)
            .eq("id", editingId);
          if (errRetry) {
            toast.error("Erro ao atualizar transação");
            console.error(errRetry);
          } else {
            toast.warning("Transação atualizada sem vincular conta. Aplique a migration de conta_id.");
            setIsDialogOpen(false);
            setIsEditMode(false);
            setEditingId(null);
            fetchTransacoes();
            await ensureCarteiraSync(editingId);
          }
        } else {
          toast.error("Erro ao atualizar transação");
          console.error(error);
        }
      } else {
        toast.success("Transação atualizada com sucesso!");
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        fetchTransacoes();
        await ensureCarteiraSync(editingId);
      }
    } else {
      const hoje = new Date().toISOString().split('T')[0];
      if (formData.tipo === "APORTE") {
        if (!formData.conta_id || !formData.conta_destino_id) {
          toast.error("Selecione a conta de origem e a conta destino");
          return;
        }
        if (formData.conta_id === formData.conta_destino_id) {
          toast.error("Conta origem e destino devem ser diferentes");
          return;
        }

        const valorNum = parseFloat(formData.valor);
        const despesaPayload = {
          user_id: user.id,
          tipo: "DESPESA",
          categoria: "Aporte",
          valor: valorNum,
          data_vencimento: formData.data_vencimento,
          descricao: formData.descricao || "Aporte para outra conta",
          agendamento_id: formData.agendamento_id || null,
          data_liquidacao: formData.liquidarFuturo ? null : hoje,
          conta_id: formData.conta_id || null,
        };
        const receitaPayload = {
          user_id: user.id,
          tipo: "RECEITA",
          categoria: "Aporte",
          valor: valorNum,
          data_vencimento: formData.data_vencimento,
          descricao: formData.descricao || "Aporte recebido de outra conta",
          agendamento_id: formData.agendamento_id || null,
          data_liquidacao: formData.liquidarFuturo ? null : hoje,
          conta_id: formData.conta_destino_id || null,
        };

        let createdDesp: any = null;
        const { data: createdDespInit, error: errDesp } = await supabase
          .from("transacoes")
          .insert(despesaPayload)
          .select("id")
          .single();
        if (!errDesp) {
          createdDesp = createdDespInit as any;
        } else {
          const msg = String(errDesp.message || "");
          const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");
          if (!isSchemaCacheConta) {
            toast.error("Erro ao criar parte de origem do aporte");
            console.error(errDesp);
            return;
          }
          const fallbackDesp = { ...despesaPayload } as any;
          delete fallbackDesp.conta_id;
          const { data: createdDesp2, error: errDesp2 } = await supabase
            .from("transacoes")
            .insert(fallbackDesp)
            .select("id")
            .single();
          if (errDesp2) {
            toast.error("Erro ao criar parte de origem do aporte");
            console.error(errDesp2);
            return;
          }
          createdDesp = createdDesp2 as any;
          toast.warning("Aporte origem criado sem conta_id. Aplique a migration.");
        }
        const { error: errRec } = await supabase
          .from("transacoes")
          .insert(receitaPayload);
        if (errRec) {
          const msg = String(errRec.message || "");
          const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");
          if (!isSchemaCacheConta) {
            await supabase.from("transacoes").delete().eq("id", createdDesp.id);
            toast.error("Erro ao criar parte de destino do aporte");
            console.error(errRec);
            return;
          }
          const fallbackRec = { ...receitaPayload } as any;
          delete fallbackRec.conta_id;
          const { error: errRec2 } = await supabase
            .from("transacoes")
            .insert(fallbackRec);
          if (errRec2) {
            await supabase.from("transacoes").delete().eq("id", createdDesp.id);
            toast.error("Erro ao criar parte de destino do aporte");
            console.error(errRec2);
            return;
          }
          toast.warning("Aporte destino criado sem conta_id. Aplique a migration.");
        }
        toast.success("Aporte criado com sucesso!");
      } else {
        const payload = {
          user_id: user.id,
          tipo: formData.tipo,
          categoria: formData.categoria,
          valor: parseFloat(formData.valor),
          data_vencimento: formData.data_vencimento,
          descricao: formData.descricao,
          agendamento_id: formData.agendamento_id || null,
          data_liquidacao: formData.liquidarFuturo ? null : hoje,
          conta_id: formData.conta_id || null,
        };
        const { error } = await supabase.from("transacoes").insert(payload);
        if (error) {
          const msg = String(error.message || "");
          const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");
          if (isSchemaCacheConta) {
            const fallback = { ...payload } as any;
            delete fallback.conta_id;
            const { error: err2 } = await supabase.from("transacoes").insert(fallback);
            if (err2) {
              toast.error("Erro ao criar transação");
              console.error(err2);
              return;
            }
            toast.warning("Transação criada sem conta_id. Aplique a migration.");
          } else {
            toast.error("Erro ao criar transação");
            console.error(error);
            return;
          }
        }
        toast.success("Transação criada com sucesso!");
      }

      setFormData({
        tipo: "RECEITA",
        categoria: "",
        valor: "",
        data_vencimento: "",
        descricao: "",
        agendamento_id: "",
        liquidarFuturo: true,
        conta_id: "",
        conta_destino_id: "",
      });
      setIsDialogOpen(false);
      fetchTransacoes();
    }
  };

  const openLiquidarDialog = (t: Transacao) => {
    setLiquidarTargetId(t.id);
    setLiquidarContaId(String(t.conta_id || ""));
    setLiquidarData(new Date().toISOString().split('T')[0]);
    setIsLiquidarOpen(true);
  };

  const handleConfirmLiquidar = async () => {
    if (!liquidarTargetId) return;
    if (!liquidarContaId) {
      toast.error("Selecione um banco/conta para a baixa");
      return;
    }
    const transacaoAlvo = transacoes.find((t) => t.id === liquidarTargetId);
    const carteiraPayload = transacaoAlvo ? {
      user_id: user?.id,
      tipo: transacaoAlvo.tipo === 'DESPESA' ? 'DESPESA' : 'RECEITA',
      categoria: transacaoAlvo.categoria,
      valor: Number(transacaoAlvo.valor || 0),
      data_vencimento: transacaoAlvo.data_vencimento,
      descricao: transacaoAlvo.descricao,
      agendamento_id: transacaoAlvo.agendamento_id || null,
      data_liquidacao: liquidarData,
      conta_id: liquidarContaId,
    } : null;
    const payload: any = {
      data_liquidacao: liquidarData,
      conta_id: liquidarContaId,
    };
    const { error } = await supabase
      .from("transacoes")
      .update(payload)
      .eq("id", liquidarTargetId);

    if (error) {
      const msg = String(error.message || "");
      const isSchemaCacheConta = msg.includes("conta_id") || msg.includes("schema cache");
      if (isSchemaCacheConta) {
        const { error: errRetry } = await supabase
          .from("transacoes")
          .update({ data_liquidacao: liquidarData })
          .eq("id", liquidarTargetId);
        if (errRetry) {
          toast.error("Erro ao liquidar transação");
          console.error(errRetry);
          return;
        }
        toast.warning("Baixa feita sem vincular conta na tabela transacoes. Aplique a migration de conta_id.");
        if (carteiraPayload) {
          const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
          const { error: errCarteira } = await sb
            .from("financeiro_tattoo")
            .insert(carteiraPayload);
          if (errCarteira) {
            console.error(errCarteira);
          }
        }
        setIsLiquidarOpen(false);
        setLiquidarTargetId(null);
        fetchTransacoes();
        return;
      } else {
        toast.error("Erro ao liquidar transação");
        console.error(error);
      }
    } else {
      toast.success("Transação liquidada!");
      if (carteiraPayload) {
        const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
        const { error: errCarteira } = await sb
          .from("financeiro_tattoo")
          .insert(carteiraPayload);
        if (errCarteira) {
          console.error(errCarteira);
        }
      }
      setIsLiquidarOpen(false);
      setLiquidarTargetId(null);
      fetchTransacoes();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("transacoes")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao deletar transação");
      console.error(error);
    } else {
      toast.success("Transação deletada!");
      fetchTransacoes();
    }
  };

  const openNewDialog = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      tipo: "RECEITA",
      categoria: "",
      valor: "",
      data_vencimento: "",
      descricao: "",
      agendamento_id: "",
      liquidarFuturo: true,
      conta_id: "",
      conta_destino_id: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (t: Transacao) => {
    setIsEditMode(true);
    setEditingId(t.id);
    setFormData({
      tipo: t.tipo,
      categoria: t.categoria,
      valor: String(Number(t.valor).toFixed(2)),
      data_vencimento: t.data_vencimento,
      descricao: t.descricao,
      agendamento_id: t.agendamento_id || "",
      liquidarFuturo: true,
      conta_id: t.conta_id || "",
      conta_destino_id: "",
    });
    setIsDialogOpen(true);
  };

  const transacoesFiltradas = transacoes.filter((t) => {
    if (filtroTipo !== "TODOS" && t.tipo !== filtroTipo) return false;
    if (filtroCategoria !== "TODOS" && t.categoria !== filtroCategoria) return false;
    if (filtroStatus === "LIQUIDADAS" && !t.data_liquidacao) return false;
    if (filtroStatus === "PENDENTES" && t.data_liquidacao) return false;
    if (filtroContaId !== "TODAS" && (t.conta_id ?? "") !== filtroContaId) return false;
    return true;
  });

  const totalReceitas = transacoesFiltradas
    .filter((t) => t.tipo === "RECEITA" && t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === "DESPESA" && t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const receitasPendentes = transacoesFiltradas
    .filter((t) => t.tipo === "RECEITA" && !t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const despesasPendentes = transacoesFiltradas
    .filter((t) => t.tipo === "DESPESA" && !t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const saldo = totalReceitas - totalDespesas;

  const transacoesPorData = transacoesFiltradas.reduce((acc, t) => {
    const key = t.data_vencimento;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Transacao[]>);

  const datasOrdenadas = Object.keys(transacoesPorData).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const handleCalendarDateClick = (date: string) => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      tipo: "RECEITA",
      categoria: "",
      valor: "",
      data_vencimento: date,
      descricao: "",
      agendamento_id: "",
      liquidarFuturo: true,
      conta_id: "",
      conta_destino_id: "",
    });
    setIsDialogOpen(true);
  };

  const hasActiveFilters =
    filtroTipo !== "TODOS" || filtroCategoria !== "TODOS" || filtroStatus !== "TODOS" || filtroContaId !== "TODAS";

  const categoriasDisponiveis = formData.tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const todasCategoriasUnicas = Array.from(new Set([...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA]));
  const categoriasComPrefixo = [
    ...CATEGORIAS_RECEITA.map(cat => ({ key: `receita-${cat}`, value: cat, label: cat })),
    ...CATEGORIAS_DESPESA.map(cat => ({ key: `despesa-${cat}`, value: cat, label: cat }))
  ];
  const categoriasParaFiltro = categoriasComPrefixo.filter((cat, index, self) =>
    self.findIndex(c => c.value === cat.value) === index
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Financeiro Tattoo</h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de receitas e despesas
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 rounded-xl bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-success/20">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Receitas</p>
          </div>
          <p className="text-2xl font-semibold">
            R$ {totalReceitas.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pendente: R$ {receitasPendentes.toFixed(2)}
          </p>
        </Card>

        <Card className="p-6 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-destructive/20">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">Despesas</p>
          </div>
          <p className="text-2xl font-semibold">
            R$ {totalDespesas.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pendente: R$ {despesasPendentes.toFixed(2)}
          </p>
        </Card>

        <Card className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/20">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Saldo</p>
          </div>
          <p className={`text-2xl font-semibold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
            R$ {saldo.toFixed(2)}
          </p>
        </Card>

        <Card className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-accent/20">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">A Vencer</p>
          </div>
          <p className="text-2xl font-semibold">
            {transacoesFiltradas.filter(t => !t.data_liquidacao).length}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="tabela" className="space-y-4">
        <div className="flex justify-center">
          <TabsList className="inline-flex w-auto rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
            <TabsTrigger value="tabela" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">Tabela</TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">Calendário</TabsTrigger>
            <TabsTrigger value="lista" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">Lista</TabsTrigger>
            <TabsTrigger value="bancos" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">Bancos</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex justify-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-lg h-9">
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[520px] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {transacoesFiltradas.length} resultados
                  </Badge>
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    disabled={!hasActiveFilters}
                    onClick={() => {
                      setFiltroTipo("TODOS");
                      setFiltroCategoria("TODOS");
                      setFiltroStatus("TODOS");
                      setFiltroContaId("TODAS");
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="RECEITA">Receitas</SelectItem>
                      <SelectItem value="DESPESA">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas</SelectItem>
                      {categoriasParaFiltro.map((cat) => (
                        <SelectItem key={cat.key} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="LIQUIDADAS">Liquidadas</SelectItem>
                      <SelectItem value="PENDENTES">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select value={filtroContaId} onValueChange={setFiltroContaId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas</SelectItem>
                      {contas.map((c) => {
                        const bank = (c as any).banco_detalhes?.nome_curto || (c as any).banco || "";
                        const label = bank ? `${bank} · ${c.nome}` : `${c.nome}`;
                        return (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">Filtros ativos:</span>
                  {filtroTipo !== "TODOS" && (
                    <Badge variant="secondary" className="rounded-full text-xs">{filtroTipo}</Badge>
                  )}
                  {filtroCategoria !== "TODOS" && (
                    <Badge variant="secondary" className="rounded-full text-xs">{filtroCategoria}</Badge>
                  )}
                  {filtroStatus !== "TODOS" && (
                    <Badge variant="secondary" className="rounded-full text-xs">{filtroStatus}</Badge>
                  )}
                  {filtroContaId !== "TODAS" && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {(() => {
                        const c = contas.find(c => String(c.id) === filtroContaId);
                        if (!c) return "Conta";
                        const bank = (c as any).banco_detalhes?.nome_curto || (c as any).banco || "";
                        return bank ? `${bank} · ${c.nome}` : `${c.nome}`;
                      })()}
                    </Badge>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg gap-2 h-9 px-3" onClick={openNewDialog}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Transação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar Transação" : "Nova Transação"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: TipoTransacao) =>
                      setFormData({ ...formData, tipo: value, categoria: value === "APORTE" ? "Aporte" : "" })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEITA">Receita</SelectItem>
                      <SelectItem value="DESPESA">Despesa</SelectItem>
                      <SelectItem value="APORTE">Aporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.tipo !== "APORTE" && (
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) =>
                        setFormData({ ...formData, categoria: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasDisponiveis.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="conta">Conta</Label>
                  <Select
                    value={formData.conta_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, conta_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma conta</SelectItem>
                      {contas.map((c) => {
                        const bank = (c as any).banco_detalhes?.nome_curto || (c as any).banco || "";
                        const label = bank ? `${bank} · ${c.nome}` : `${c.nome}`;
                        return (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {formData.tipo === "APORTE" && (
                  <div className="space-y-2">
                    <Label htmlFor="conta_destino">Conta destino</Label>
                    <Select
                      value={formData.conta_destino_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, conta_destino_id: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione a conta destino" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma conta</SelectItem>
                        {contas.map((c) => {
                          const bank = (c as any).banco_detalhes?.nome_curto || (c as any).banco || "";
                          const label = bank ? `${bank} · ${c.nome}` : `${c.nome}`;
                          return (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.conta_id && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Saldo inicial</Label>
                      <p className="text-sm font-semibold">R$ {saldoConta.saldoInicial.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Saldo atual</Label>
                      <p className={`text-sm font-semibold ${saldoConta.saldoAtual >= 0 ? "text-success" : "text-destructive"}`}>R$ {saldoConta.saldoAtual.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Saldo pós-transação</Label>
                      <p className={`text-sm font-semibold ${previewSaldoPos >= 0 ? "text-success" : "text-destructive"}`}>R$ {previewSaldoPos.toFixed(2)}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="agendamento">Vincular a Agendamento (Opcional)</Label>
                  <Select
                    value={formData.agendamento_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, agendamento_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Nenhum agendamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum agendamento</SelectItem>
                      {agendamentos.map((agendamento) => {
                        const clienteNome = agendamento.projetos?.clientes?.nome;
                        const label = clienteNome
                          ? `${clienteNome} - ${agendamento.titulo} - ${new Date(agendamento.data).toLocaleDateString()}`
                          : `${agendamento.titulo} - ${new Date(agendamento.data).toLocaleDateString()}`;

                        return (
                          <SelectItem key={agendamento.id} value={agendamento.id}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="text"
                    inputMode="numeric"
                    className="rounded-xl"
                    value={formatCurrencyBR(formData.valor)}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start text-left font-normal rounded-xl"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.data_vencimento
                          ? format(
                            parse(formData.data_vencimento, "yyyy-MM-dd", new Date()),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )
                          : "dd/mm/aaaa"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComp
                        mode="single"
                        selected={formData.data_vencimento ? parse(formData.data_vencimento, "yyyy-MM-dd", new Date()) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({ ...formData, data_vencimento: format(date, "yyyy-MM-dd") });
                          }
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    className="rounded-xl"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                  />
                </div>
                {!isEditMode && (
                  <div className="space-y-2">
                    <Label htmlFor="liquidar_futuro">Liquidar no futuro?</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="liquidar_futuro"
                        checked={formData.liquidarFuturo}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, liquidarFuturo: Boolean(checked) })
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        Desative para liquidar imediatamente.
                      </span>
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full rounded-xl">
                  {isEditMode ? "Salvar Alterações" : "Salvar Transação"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="lista">
          <div className="grid gap-4">
            {transacoesFiltradas.map((transacao) => (
              <Card key={transacao.id} className="p-6 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        className={`rounded-full ${transacao.tipo === "RECEITA"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                          }`}
                      >
                        {transacao.tipo}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {transacao.categoria}
                      </Badge>
                      {transacao.data_liquidacao && (
                        <Badge className="rounded-full bg-primary/10 text-primary">
                          Liquidada
                        </Badge>
                      )}
                      {transacao.agendamentos && (
                        <Badge variant="secondary" className="rounded-full">
                          📅 {transacao.agendamentos.titulo}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{transacao.descricao}</h3>
                    <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                      <p>Valor: R$ {Number(transacao.valor).toFixed(2)}</p>
                      <p>Vencimento: {new Date(transacao.data_vencimento).toLocaleDateString()}</p>
                      {transacao.data_liquidacao && (
                        <p>Liquidação: {new Date(transacao.data_liquidacao).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!transacao.data_liquidacao && (
                      <Button
                        onClick={() => openLiquidarDialog(transacao)}
                        className="rounded-xl gap-2"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Liquidar
                      </Button>
                    )}
                    <Button
                      onClick={() => openEditDialog(transacao)}
                      variant="outline"
                      className="rounded-xl gap-2"
                      size="sm"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="rounded-xl gap-2"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é irreversível. Deseja excluir esta transação?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(transacao.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
            {transacoesFiltradas.length === 0 && (
              <Card className="p-12 rounded-xl">
                <div className="text-center text-muted-foreground">
                  <p>Nenhuma transação encontrada.</p>
                  <p className="text-sm mt-1">Clique em "Nova Transação" para começar.</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tabela">
          <Card className="rounded-2xl">
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Liquidação</TableHead>
                    <TableHead>Agendamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoesFiltradas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.descricao}</TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full ${t.tipo === "RECEITA"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                            }`}
                        >
                          {t.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.categoria}</TableCell>
                      <TableCell>R$ {Number(t.valor).toFixed(2)}</TableCell>
                      <TableCell>{new Date(t.data_vencimento).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {t.data_liquidacao ? new Date(t.data_liquidacao).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>{t.agendamentos?.titulo || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!t.data_liquidacao && (
                            <Button
                              onClick={() => openLiquidarDialog(t)}
                              className="rounded-xl gap-2"
                              size="sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Liquidar
                            </Button>
                          )}
                          <Button
                            onClick={() => openEditDialog(t)}
                            variant="outline"
                            className="rounded-xl gap-2"
                            size="sm"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                className="rounded-xl gap-2"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação é irreversível. Deseja excluir esta transação?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(t.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transacoesFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                  {transacoesFiltradas.length > 0 && (
                    <TableRow className="bg-muted/30 font-semibold border-t-2">
                      <TableCell colSpan={3} className="text-right">Total:</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-success">
                            + R$ {transacoesFiltradas
                              .filter(t => t.tipo === "RECEITA")
                              .reduce((acc, t) => acc + Number(t.valor), 0)
                              .toFixed(2)}
                          </div>
                          <div className="text-destructive">
                            - R$ {transacoesFiltradas
                              .filter(t => t.tipo === "DESPESA")
                              .reduce((acc, t) => acc + Number(t.valor), 0)
                              .toFixed(2)}
                          </div>
                          <div className="border-t pt-1">
                            R$ {(
                              transacoesFiltradas
                                .filter(t => t.tipo === "RECEITA")
                                .reduce((acc, t) => acc + Number(t.valor), 0) -
                              transacoesFiltradas
                                .filter(t => t.tipo === "DESPESA")
                                .reduce((acc, t) => acc + Number(t.valor), 0)
                            ).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          <FinancialCalendar
            transacoes={transacoesFiltradas}
            onTransacaoClick={openEditDialog}
            onDateClick={handleCalendarDateClick}
          />
        </TabsContent>

        <TabsContent value="bancos" className="space-y-6">
          <TabelaGestaoBancos />
        </TabsContent>
        {isLiquidarOpen && (
          <Dialog open={isLiquidarOpen} onOpenChange={setIsLiquidarOpen}>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>Baixar Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Banco/Conta</Label>
                  <Select value={liquidarContaId} onValueChange={setLiquidarContaId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Liquidação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 w-full justify-start text-left font-normal rounded-xl">
                        <Calendar className="mr-2 h-4 w-4" />
                        {liquidarData
                          ? format(parse(liquidarData, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", { locale: ptBR })
                          : "dd/mm/aaaa"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComp
                        mode="single"
                        selected={liquidarData ? parse(liquidarData, "yyyy-MM-dd", new Date()) : undefined}
                        onSelect={(date) => {
                          if (date) setLiquidarData(format(date, "yyyy-MM-dd"));
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                  <Button className="rounded-xl" onClick={handleConfirmLiquidar}>Confirmar Baixa</Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsLiquidarOpen(false)}>Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Tabs>
    </div>
  );
};

export default Financeiro;
