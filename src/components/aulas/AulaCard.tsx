import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { Aula, AulaStatus } from "@/hooks/useAulas";

interface Props {
  aula: Aula;
  onDoubleClick?: (a: Aula) => void;
}

const statusLabels: Record<AulaStatus, string> = {
  esboco: "Esboço inicial",
  desenvolvimento: "Desenvolvimento",
  revisao: "Revisão",
  finalizacao: "Finalização",
  pronta: "Aula pronta",
};

export function AulaCard({ aula, onDoubleClick }: Props) {
  return (
    <Card
      className="rounded-xl hover:shadow transition-all select-none"
      draggable
      onDoubleClick={() => onDoubleClick?.(aula)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold truncate">{aula.titulo}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {statusLabels[aula.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {aula.descricao && (
          <div className="text-xs text-muted-foreground truncate">{aula.descricao}</div>
        )}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{aula.responsavel_id ? "Responsável definido" : "Sem responsável"}</span>
          </div>
          {aula.prazo && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span>{new Date(aula.prazo).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

