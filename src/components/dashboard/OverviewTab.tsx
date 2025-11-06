import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Briefcase, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, Bell } from "lucide-react";
import { AdvancedCharts } from "./AdvancedCharts";
import { DraggableWidgets } from "./DraggableWidgets";
// MetasOverviewCard removido da página inicial

interface OverviewTabProps {
  projetos: any[];
  clientes: any[];
  transacoes: any[];
  agendamentos: any[];
  prevProjetos?: any[];
  prevClientes?: any[];
  prevTransacoes?: any[];
  prevAgendamentos?: any[];
  onOpenMetasTab?: () => void;
  onCreateMeta?: () => void;
}

export function OverviewTab({ projetos, clientes, transacoes, agendamentos, prevProjetos = [], prevClientes = [], prevTransacoes = [], prevAgendamentos = [], onOpenMetasTab, onCreateMeta }: OverviewTabProps) {
  const norm = (v: any) => String(v || '').toLowerCase();
  const projetosAtivos = projetos.filter(p => norm(p.status) !== "concluido" && norm(p.status) !== "cancelado").length;
  const receitas = transacoes.filter(t => norm(t.tipo) === "receita").reduce((sum, t) => sum + Number(t.valor || 0), 0);
  const agendamentosAtivos = agendamentos.filter(a => a.status === "agendado").length;

  const prevProjetosAtivos = (prevProjetos || []).filter(p => norm(p.status) !== "concluido" && norm(p.status) !== "cancelado").length;
  const prevReceitas = (prevTransacoes || [])
    .filter(t => norm(t.tipo) === "receita")
    .reduce((sum, t) => sum + Number(t.valor || 0), 0);
  const prevAgendamentosAtivos = (prevAgendamentos || []).filter(a => a.status === "agendado").length;

  const calcChange = (current: number, previous: number) => {
    if (!previous && current) return { change: 100, trend: "up" as const };
    if (!previous && !current) return { change: 0, trend: "up" as const };
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    return { change: Math.abs(Number(percent.toFixed(1))), trend: diff >= 0 ? "up" as const : "down" as const };
  };

  const stats = [
    {
      icon: Users,
      label: "Total de Clientes",
      value: clientes.length.toString(),
      color: "text-primary",
      bgColor: "bg-primary/20",
      ...calcChange(clientes.length, (prevClientes || []).length)
    },
    {
      icon: Briefcase,
      label: "Projetos Ativos",
      value: projetosAtivos.toString(),
      color: "text-primary",
      bgColor: "bg-primary/20",
      ...calcChange(projetosAtivos, prevProjetosAtivos)
    },
    {
      icon: Calendar,
      label: "Agendamentos",
      value: agendamentosAtivos.toString(),
      color: "text-primary",
      bgColor: "bg-primary/20",
      ...calcChange(agendamentosAtivos, prevAgendamentosAtivos)
    },
    {
      icon: DollarSign,
      label: "Receitas Total",
      value: `R$ ${(receitas / 1000).toFixed(1)}K`,
      color: "text-primary",
      bgColor: "bg-primary/20",
      ...calcChange(receitas, prevReceitas)
    },
  ];

  return (
    <div className="space-y-8">
      {/* Métricas Principais Melhoradas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          const isPositive = stat.trend === "up";
          
          return (
            <Card 
              key={stat.label} 
              className="rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden bg-gradient-to-br from-background to-muted/20"
            >
              {/* Gradiente de fundo sutil */}
              <div className={`absolute inset-0 opacity-5 ${stat.bgColor.replace('/10', '')}`} />
              
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendIcon className={`w-3 h-3 ${isPositive ? "text-green-500" : "text-red-500"}`} />
                    <span className={isPositive ? "text-green-500" : "text-red-500"}>
                      {Math.abs(stat.change)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                    <span className="text-xs text-muted-foreground">este mês</span>
                  </div>
                </div>

              {/* Barra de meta removida para visual mais limpo */}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Card de Metas removido da visão geral */}

      {/* Seções Avançadas com Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="rounded-2xl p-1.5 bg-muted/50">
          <TabsTrigger value="analytics" className="rounded-xl">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="widgets" className="rounded-xl">
            <TrendingUp className="w-4 h-4 mr-2" />
            Widgets
          </TabsTrigger>
          {/* Insights movidos para uma aba dedicada no dashboard */}
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <AdvancedCharts 
            transacoes={transacoes}
            clientes={clientes}
            projetos={projetos}
            agendamentos={agendamentos}
          />
        </TabsContent>

        <TabsContent value="widgets" className="space-y-6">
          <DraggableWidgets 
            transacoes={transacoes}
            clientes={clientes}
            projetos={projetos}
            agendamentos={agendamentos}
          />
        </TabsContent>

        {/* Conteúdo de Insights removido desta aba */}
      </Tabs>
    </div>
  );
}
