import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar } from "lucide-react";
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
    const bank = conta.banco_detalhes?.nome_curto || conta.banco || "";
    return bank ? `${bank} · ${conta.nome}` : conta.nome;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-lg gap-2 h-9 px-3" onClick={onOpenNew}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Transação</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
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
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {getContaLabel(c)}
                    </SelectItem>
                  ))}
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
                <p className={`text-sm font-semibold ${saldoConta.saldoAtual >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {saldoConta.saldoAtual.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <Label>Saldo pós-transação</Label>
                <p className={`text-sm font-semibold ${previewSaldoPos >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {previewSaldoPos.toFixed(2)}
                </p>
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
  );
}

export default TransacaoFormDialog;

