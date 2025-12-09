import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Transacao } from "@/services/transacoes.service";

interface TransacaoCardProps {
  transacao: Transacao;
  onLiquidar: (transacao: Transacao) => void;
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => void;
}

export function TransacaoCard({
  transacao,
  onLiquidar,
  onEdit,
  onDelete,
}: TransacaoCardProps) {
  return (
    <Card className="p-6 rounded-xl hover:shadow-lg transition-shadow">
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
              onClick={() => onLiquidar(transacao)}
              className="rounded-xl gap-2"
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Liquidar
            </Button>
          )}
          <Button
            onClick={() => onEdit(transacao)}
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
                  onClick={() => onDelete(transacao.id)}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

export default TransacaoCard;

