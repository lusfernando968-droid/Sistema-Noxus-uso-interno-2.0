import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface TransacoesTableViewProps {
  transacoes: Transacao[];
  onLiquidar: (transacao: Transacao) => void;
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => void;
}

export function TransacoesTableView({
  transacoes,
  onLiquidar,
  onEdit,
  onDelete,
}: TransacoesTableViewProps) {
  const totalReceitas = transacoes
    .filter(t => t.tipo === "RECEITA")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const totalDespesas = transacoes
    .filter(t => t.tipo === "DESPESA")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  return (
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
            {transacoes.map((t) => (
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
                        onClick={() => onLiquidar(t)}
                        className="rounded-xl gap-2"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Liquidar
                      </Button>
                    )}
                    <Button
                      onClick={() => onEdit(t)}
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
                            onClick={() => onDelete(t.id)}
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
            {transacoes.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            )}
            {transacoes.length > 0 && (
              <TableRow className="bg-muted/30 font-semibold border-t-2">
                <TableCell colSpan={3} className="text-right">Total:</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-success">
                      + R$ {totalReceitas.toFixed(2)}
                    </div>
                    <div className="text-destructive">
                      - R$ {totalDespesas.toFixed(2)}
                    </div>
                    <div className="border-t pt-1">
                      R$ {(totalReceitas - totalDespesas).toFixed(2)}
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
  );
}

export default TransacoesTableView;

