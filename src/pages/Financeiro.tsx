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
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialCalendar } from "@/components/calendar/FinancialCalendar";
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


type TipoTransacao = "RECEITA" | "DESPESA";

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
}

interface Agendamento {
  id: string;
  titulo: string;
  data: string;
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
  "Outros"
];



const Financeiro = () => {
  const { user } = useAuth();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoTransacao>("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "LIQUIDADAS" | "PENDENTES">("TODOS");
  const [formData, setFormData] = useState({
    tipo: "RECEITA" as TipoTransacao,
    categoria: "",
    valor: "",
    data_vencimento: "",
    descricao: "",
    agendamento_id: "",
    liquidarFuturo: true,
  });

  // Formatação de moeda BRL para o campo Valor
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
    }
  };

  const fetchAgendamentos = async () => {
    const { data, error } = await supabase
      .from("agendamentos")
      .select("id, titulo, data")
      .order("data", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setAgendamentos(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (isEditMode && editingId) {
      // Atualização de transação existente (não modifica data_liquidacao aqui)
      const updatePayload = {
        tipo: formData.tipo,
        categoria: formData.categoria,
        valor: parseFloat(formData.valor),
        data_vencimento: formData.data_vencimento,
        descricao: formData.descricao,
        agendamento_id: formData.agendamento_id || null,
      };

      const { error } = await supabase
        .from("transacoes")
        .update(updatePayload)
        .eq("id", editingId);

      if (error) {
        toast.error("Erro ao atualizar transação");
        console.error(error);
      } else {
        toast.success("Transação atualizada com sucesso!");
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        fetchTransacoes();
      }
    } else {
      // Criação de nova transação
      const hoje = new Date().toISOString().split('T')[0];
      const payload = {
        user_id: user.id,
        tipo: formData.tipo,
        categoria: formData.categoria,
        valor: parseFloat(formData.valor),
        data_vencimento: formData.data_vencimento,
        descricao: formData.descricao,
        agendamento_id: formData.agendamento_id || null,
        data_liquidacao: formData.liquidarFuturo ? null : hoje,
      };

      const { error } = await supabase.from("transacoes").insert(payload);

      if (error) {
        toast.error("Erro ao criar transação");
        console.error(error);
      } else {
        toast.success("Transação criada com sucesso!");
        setFormData({ 
          tipo: "RECEITA", 
          categoria: "",
          valor: "", 
          data_vencimento: "", 
          descricao: "",
          agendamento_id: "",
          liquidarFuturo: true,
        });
        setIsDialogOpen(false);
        fetchTransacoes();
      }
    }
  };

  const handleLiquidar = async (id: string) => {
    const { error } = await supabase
      .from("transacoes")
      .update({ data_liquidacao: new Date().toISOString().split('T')[0] })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao liquidar transação");
      console.error(error);
    } else {
      toast.success("Transação liquidada!");
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
    });
    setIsDialogOpen(true);
  };

  const transacoesFiltradas = transacoes.filter((t) => {
    if (filtroTipo !== "TODOS" && t.tipo !== filtroTipo) return false;
    if (filtroCategoria !== "TODOS" && t.categoria !== filtroCategoria) return false;
    if (filtroStatus === "LIQUIDADAS" && !t.data_liquidacao) return false;
    if (filtroStatus === "PENDENTES" && t.data_liquidacao) return false;
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

  // Agrupar transações por data de vencimento para visualização de Agenda
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
    });
    setIsDialogOpen(true);
  };

  const hasActiveFilters =
    filtroTipo !== "TODOS" || filtroCategoria !== "TODOS" || filtroStatus !== "TODOS";

  const categoriasDisponiveis = formData.tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  
  // Criar lista única de categorias para filtros, evitando duplicatas
  const todasCategoriasUnicas = Array.from(new Set([...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA]));
  
  // Criar categorias com prefixos para chaves únicas
  const categoriasComPrefixo = [
    ...CATEGORIAS_RECEITA.map(cat => ({ key: `receita-${cat}`, value: cat, label: cat })),
    ...CATEGORIAS_DESPESA.map(cat => ({ key: `despesa-${cat}`, value: cat, label: cat }))
  ];
  
  // Remover duplicatas mantendo apenas valores únicos
  const categoriasParaFiltro = categoriasComPrefixo.filter((cat, index, self) => 
    self.findIndex(c => c.value === cat.value) === index
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de receitas e despesas
          </p>
        </div>
        {/* Botões removidos do topo - serão reposicionados abaixo das abas */}
        {/* espaço reservado vazio */}
      </div>
      

      {/* Filtros movidos para Popover acima */}

      {/* Cards de resumo */}
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
      {/* Filtros movidos para Popover acima */}

      {/* Abas de visualização: Tabela, Calendário e Lista */}
      <Tabs defaultValue="tabela" className="space-y-4">
        <div className="flex justify-center">
          <TabsList className="inline-flex w-auto rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
            <TabsTrigger value="tabela" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">Tabela</TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">Calendário</TabsTrigger>
            <TabsTrigger value="lista" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">Lista</TabsTrigger>
          </TabsList>
        </div>
        {/* Toolbar reposicionada abaixo das abas */}
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
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      setFormData({ ...formData, tipo: value, categoria: "" })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEITA">Receita</SelectItem>
                      <SelectItem value="DESPESA">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      {agendamentos.map((agendamento) => (
                        <SelectItem key={agendamento.id} value={agendamento.id}>
                          {agendamento.titulo} - {new Date(agendamento.data).toLocaleDateString()}
                        </SelectItem>
                      ))}
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

        {/* Lista (cartões) */}
        <TabsContent value="lista">
          <div className="grid gap-4">
            {transacoesFiltradas.map((transacao) => (
              <Card key={transacao.id} className="p-6 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        className={`rounded-full ${
                          transacao.tipo === "RECEITA"
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
                        onClick={() => handleLiquidar(transacao.id)}
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

        {/* Tabela */}
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
                          className={`rounded-full ${
                            t.tipo === "RECEITA"
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
                              onClick={() => handleLiquidar(t.id)}
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
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Agenda (visualização em calendário) */}
        <TabsContent value="agenda" className="space-y-6">
          <FinancialCalendar
            transacoes={transacoesFiltradas}
            onTransacaoClick={openEditDialog}
            onDateClick={handleCalendarDateClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;
