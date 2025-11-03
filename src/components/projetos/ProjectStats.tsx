import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, CheckCircle2, XCircle } from "lucide-react";

type Status = "planejamento" | "andamento" | "concluido" | "cancelado";

type Projeto = {
  status: Status;
};

interface ProjectStatsProps {
  projetos: Projeto[];
}

export function ProjectStats({ projetos }: ProjectStatsProps) {
  const stats = {
    total: projetos.length,
    planejamento: projetos.filter(p => p.status === "planejamento").length,
    andamento: projetos.filter(p => p.status === "andamento").length,
    concluido: projetos.filter(p => p.status === "concluido").length,
    cancelado: projetos.filter(p => p.status === "cancelado").length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Planejamento</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.planejamento}</div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.andamento}</div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.concluido}</div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.cancelado}</div>
        </CardContent>
      </Card>
    </div>
  );
}
