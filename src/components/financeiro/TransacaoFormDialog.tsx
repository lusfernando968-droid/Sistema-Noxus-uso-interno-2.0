import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, FileText, Wallet, DollarSign, Tag, Link as LinkIcon } from "lucide-react";
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
import {
  TipoTransacao,
  Agendamento,
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
} from "@/services/transacoes.service";

interface ContaBancaria {
  id: string;
  nome: string;
  banco_detalhes?: { nome_curto?: string } | null;
  banco?: string;
}

export interface TransacaoFormData {
  tipo: TipoTransacao;
  categoria: string;
  valor: string;
  data_vencimento: string;
  descricao: string;
  agendamento_id: string;
  liquidarFuturo: boolean;
  conta_id: string;
  conta_destino_id: string;
}

interface SaldoConta {
  saldoInicial: number;
  saldoAtual: number;
}

interface TransacaoFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  formData: TransacaoFormData;
  setFormData: (data: TransacaoFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  contas: ContaBancaria[];
  agendamentos: Agendamento[];
  saldoConta: SaldoConta;
  previewSaldoPos: number;
  onOpenNew: () => void;
}

function formatCurrencyBR(value: string): string {
  if (value === "") return "";
  const num = Number(value);
  if (!isFinite(num)) return "";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TransacaoFormDialog({
  isOpen,
  onOpenChange,
  isEditMode,
  formData,
  setFormData,
  onSubmit,
  contas,
  agendamentos,
  saldoConta,
  previewSaldoPos,
  onOpenNew,
}: TransacaoFormDialogProps) {
  const categoriasDisponiveis = formData.tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = String(e.target.value).replace(/\D/g, "");
    if (!digitsOnly) {
      setFormData({ ...formData, valor: "" });
      return;
    }
    const cents = parseInt(digitsOnly, 10);
    const value = (cents / 100).toFixed(2);
    setFormData({ ...formData, valor: value });
  };

  const getContaLabel = (conta: ContaBancaria): string => {
    return conta.nome;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-lg gap-2 h-9 px-3" onClick={onOpenNew}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Transação</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isEditMode ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-6 space-y-6">

          {/* Section 1: Informações Básicas */}
          <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
              <FileText className="w-4 h-4" />
              <span>Informações Básicas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-xs font-medium text-muted-foreground uppercase">Tipo</Label>
                <Select
                  value={
                    formData.tipo === "DESPESA" && formData.categoria === "Pró-labore"
                      ? "RETIRADA"
                      : formData.tipo
                  }
                  onValueChange={(value: string) => {
                    if (value === "RETIRADA") {
                      setFormData({
                        ...formData,
                        tipo: "DESPESA",
                        categoria: "Pró-labore",
                      });
                    } else {
                      setFormData({
                        ...formData,
                        tipo: value as TipoTransacao,
                        categoria: value === "APORTE" ? "Aporte" : "",
                      });
                    }
                  }}
                >
                  <SelectTrigger className="bg-background h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEITA">Receita</SelectItem>
                    <SelectItem value="DESPESA">Despesa</SelectItem>
                    <SelectItem value="RETIRADA">Retirada de Salário</SelectItem>
                    <SelectItem value="APORTE">Aporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo !== "APORTE" && formData.categoria !== "Pró-labore" && (
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-xs font-medium text-muted-foreground uppercase">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger className="bg-background h-10">
                      <SelectValue placeholder="Selecione..." />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-xs font-medium text-muted-foreground uppercase">Descrição</Label>
              <Input
                id="descricao"
                className="bg-background"
                placeholder="Ex: Pagamento de fornecedor..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 2: Valores e Prazos */}
          <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Valores e Prazos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-xs font-medium text-muted-foreground uppercase">Valor (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
                  <Input
                    id="valor"
                    type="text"
                    inputMode="numeric"
                    className="pl-9 bg-background font-medium"
                    value={formatCurrencyBR(formData.valor).replace('R$', '').trim()}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_vencimento" className="text-xs font-medium text-muted-foreground uppercase">Data de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-background h-10"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formData.data_vencimento
                        ? format(
                          parse(formData.data_vencimento, "yyyy-MM-dd", new Date()),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )
                        : "Selecione a data"}
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
            </div>

            {!isEditMode && (
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="liquidar_futuro"
                  checked={formData.liquidarFuturo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, liquidarFuturo: Boolean(checked) })
                  }
                />
                <Label htmlFor="liquidar_futuro" className="text-sm cursor-pointer">
                  Liquidar no futuro? <span className="text-muted-foreground font-normal">(Manter como pendente)</span>
                </Label>
              </div>
            )}
          </div>

          {/* Section 3: Origem e Destino */}
          <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
              <Wallet className="w-4 h-4" />
              <span>Origem e Vinculação</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conta" className="text-xs font-medium text-muted-foreground uppercase">
                  {formData.categoria === "Pró-labore" ? "Conta Origem (Caixa)" : "Conta de Origem"}
                </Label>
                <Select
                  value={formData.conta_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, conta_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger className="bg-background h-10">
                    <SelectValue placeholder="Selecione a conta..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma conta</SelectItem>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {getContaLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === "APORTE" && (
                <div className="space-y-2">
                  <Label htmlFor="conta_destino" className="text-xs font-medium text-muted-foreground uppercase">Conta Destino</Label>
                  <Select
                    value={formData.conta_destino_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, conta_destino_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger className="bg-background h-10">
                      <SelectValue placeholder="Selecione o destino..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma conta</SelectItem>
                      {contas.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {getContaLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="agendamento" className="text-xs font-medium text-muted-foreground uppercase">Vinculação</Label>
                <Select
                  value={formData.agendamento_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, agendamento_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger className="bg-background h-10">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LinkIcon className="w-3 h-3" />
                      <SelectValue placeholder="Vincular a agendamento..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum vínculo</SelectItem>
                    {agendamentos.map((agendamento) => {
                      const clienteNome = agendamento.projetos?.clientes?.nome;
                      const label = clienteNome
                        ? `${clienteNome} - ${agendamento.titulo}`
                        : `${agendamento.titulo}`;
                      return (
                        <SelectItem key={agendamento.id} value={agendamento.id}>
                          <span className="flex flex-col items-start text-left">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">{new Date(agendamento.data).toLocaleDateString()}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Saldo Preview */}
            {formData.conta_id && (
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">Saldo Atual</span>
                  <span className={`text-sm font-bold ${saldoConta.saldoAtual >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    R$ {saldoConta.saldoAtual.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-muted-foreground">→</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground uppercase">Saldo Previsto</span>
                  <span className={`text-sm font-bold ${previewSaldoPos >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    R$ {previewSaldoPos.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" size="lg" className="w-full rounded-xl text-base font-semibold shadow-lg hover:shadow-primary/20 transition-all">
              {isEditMode ? "Salvar Alterações" : "Confirmar Transação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TransacaoFormDialog;

