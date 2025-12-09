import { Card } from "@/components/ui/card";
import { Transacao } from "@/services/transacoes.service";
import { TransacaoCard } from "./TransacaoCard";

interface TransacoesListViewProps {
  transacoes: Transacao[];
  onLiquidar: (transacao: Transacao) => void;
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => void;
}

export function TransacoesListView({
  transacoes,
  onLiquidar,
  onEdit,
  onDelete,
}: TransacoesListViewProps) {
  if (transacoes.length === 0) {
    return (
      <Card className="p-12 rounded-xl">
        <div className="text-center text-muted-foreground">
          <p>Nenhuma transação encontrada.</p>
          <p className="text-sm mt-1">Clique em "Nova Transação" para começar.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {transacoes.map((transacao) => (
        <TransacaoCard
          key={transacao.id}
          transacao={transacao}
          onLiquidar={onLiquidar}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default TransacoesListView;

