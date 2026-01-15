import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Pencil, DollarSign } from "lucide-react";
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
    <Card className="rounded-3xl border-0 shadow-xl overflow-hidden bg-background/50 backdrop-blur-sm">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/5">
              <TableHead className="py-6 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</TableHead>
              <TableHead className="py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
              <TableHead className="py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</TableHead>
              <TableHead className="py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor</TableHead>
              <TableHead className="py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencimento</TableHead>
              <TableHead className="py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Liquidação</TableHead>
              <TableHead className="py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agendamento</TableHead>
              <TableHead className="py-6 px-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoes.map((t) => (
              <TableRow key={t.id} className="cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/5">
                <TableCell className="py-4 px-6 font-medium text-foreground">{t.descricao}</TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant="outline"
                    className={`rounded-lg px-2.5 py-0.5 border-0 font-medium ${t.tipo === "RECEITA"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                  >
                    {t.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-muted-foreground">{t.categoria}</TableCell>
                <TableCell className="py-4 font-semibold text-foreground">R$ {Number(t.valor).toFixed(2)}</TableCell>
                <TableCell className="py-4 text-muted-foreground">{new Date(t.data_vencimento).toLocaleDateString()}</TableCell>
                <TableCell className="py-4 text-muted-foreground">
                  {t.data_liquidacao ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full w-fit">
                      <CheckCircle2 className="w-3 h-3" />
                      {new Date(t.data_liquidacao).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 text-muted-foreground">{t.agendamentos?.titulo || "—"}</TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => onEdit(t)}
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full hover:bg-muted hover:text-foreground text-muted-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground/70"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é irreversível. Deseja excluir esta transação?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl border-0 bg-muted hover:bg-muted/80">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
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
                <TableCell colSpan={8} className="text-center text-muted-foreground py-16">
                  <div className="flex flex-col items-center gap-3 opacity-50">
                    <div className="p-4 rounded-full bg-muted">
                      <DollarSign className="w-8 h-8" />
                    </div>
                    <p>Nenhuma transação encontrada.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {transacoes.length > 0 && (
              <TableRow className="bg-muted/10 font-semibold border-t">
                <TableCell colSpan={3} className="text-right py-6 px-6 text-muted-foreground">Total:</TableCell>
                <TableCell className="py-6">
                  <div className="space-y-1">
                    <div className="text-emerald-600 dark:text-emerald-400 text-xs">
                      + R$ {totalReceitas.toFixed(2)}
                    </div>
                    <div className="text-rose-600 dark:text-rose-400 text-xs">
                      - R$ {totalDespesas.toFixed(2)}
                    </div>
                    <div className="border-t border-border/10 pt-1 text-sm">
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

