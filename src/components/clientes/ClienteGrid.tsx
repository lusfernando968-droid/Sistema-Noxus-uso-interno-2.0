import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FolderOpen } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { ClienteLTVBadge } from "./ClienteLTVBadge";
import type { ClienteComLTV } from "@/hooks/useClientes";

interface ClienteGridProps {
  sortedClientes: ClienteComLTV[];
  maxLTV: number;
  deleteCliente: (id: string) => void;
}

export function ClienteGrid({
  sortedClientes,
  maxLTV,
  deleteCliente
}: ClienteGridProps) {
  const navigate = useNavigate();

  if (sortedClientes.length === 0) {
    return (
      <Card className="p-12 rounded-xl">
        <div className="text-center text-muted-foreground">
          <p>Nenhum cliente encontrado.</p>
          <p className="text-sm mt-1">Clique em "Novo Cliente" para começar.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedClientes.map(cliente => (
        <Card key={cliente.id} className="rounded-xl hover:shadow-lg transition-shadow">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-lg line-clamp-1">{cliente.nome}</h3>
                <ClienteLTVBadge ltv={cliente.ltv} maxLTV={maxLTV} />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl h-8 w-8 text-destructive" 
                onClick={() => deleteCliente(cliente.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium min-w-[60px]">Email:</span>
                <span className="text-muted-foreground truncate">{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium min-w-[60px]">Telefone:</span>
                <span className="text-muted-foreground">{cliente.telefone}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">LTV</span>
                <span className="font-semibold text-primary">{formatCurrency(cliente.ltv)}</span>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{cliente.projetos_count} projeto(s)</span>
                <span>•</span>
                <span>{cliente.transacoes_count} transação(ões)</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full rounded-xl gap-2" 
              onClick={() => navigate(`/projetos?cliente=${cliente.id}`)}
            >
              <FolderOpen className="w-4 h-4" />
              Ver Projetos
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

