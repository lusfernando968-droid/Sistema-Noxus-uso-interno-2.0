import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle2, TrendingUp, TrendingDown, Filter, Trash2, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  });

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

    const { error } = await supabase.from("transacoes").insert({
      user_id: user.id,
      tipo: formData.tipo,
      categoria: formData.categoria,
      valor: parseFloat(formData.valor),
      data_vencimento: formData.data_vencimento,
      descricao: formData.descricao,
      agendamento_id: formData.agendamento_id || null,
    });

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
      });
      setIsDialogOpen(false);
      fetchTransacoes();
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
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
                  type="number"
                  step="0.01"
                  className="rounded-xl"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  className="rounded-xl"
                  value={formData.data_vencimento}
                  onChange={(e) =>
                    setFormData({ ...formData, data_vencimento: e.target.value })
                  }
                  required
                />
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

              <Button type="submit" className="w-full rounded-xl">
                Salvar Transação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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



      {/* Filtros */}
      <Card className="p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" />
          <h3 className="font-semibold">Filtros</h3>
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
      </Card>

      {/* Lista de transações */}
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
                  onClick={() => handleDelete(transacao.id)}
                  variant="destructive"
                  className="rounded-xl gap-2"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
    </div>
  );
};

export default Financeiro;
