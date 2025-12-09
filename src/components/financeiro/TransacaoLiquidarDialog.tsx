import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContaBancaria {
  id: string;
  nome: string;
  banco_detalhes?: { nome_curto?: string } | null;
  banco?: string;
}

interface TransacaoLiquidarDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contaId: string;
  setContaId: (value: string) => void;
  data: string;
  setData: (value: string) => void;
  contas: ContaBancaria[];
  onConfirm: () => void;
}

export function TransacaoLiquidarDialog({
  isOpen,
  onOpenChange,
  contaId,
  setContaId,
  data,
  setData,
  contas,
  onConfirm,
}: TransacaoLiquidarDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>Baixar Transação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Banco/Conta</Label>
            <Select value={contaId} onValueChange={setContaId}>
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
                  {data
                    ? format(parse(data, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", { locale: ptBR })
                    : "dd/mm/aaaa"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComp
                  mode="single"
                  selected={data ? parse(data, "yyyy-MM-dd", new Date()) : undefined}
                  onSelect={(date) => {
                    if (date) setData(format(date, "yyyy-MM-dd"));
                  }}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button className="rounded-xl" onClick={onConfirm}>
              Confirmar Baixa
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TransacaoLiquidarDialog;

