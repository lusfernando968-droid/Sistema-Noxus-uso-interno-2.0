import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, PieChart, LineChart } from "lucide-react";
import { useState } from "react";

interface ChartData {
  name: string;
  value: number;
  change?: number;
}

interface AdvancedChartsProps {
  transacoes: any[];
  clientes: any[];
  projetos: any[];
  agendamentos: any[];
}

export function AdvancedCharts({ transacoes, clientes, projetos, agendamentos }: AdvancedChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'clients' | 'projects'>('revenue');

  // Dados simulados para gráficos (em produção, viriam de cálculos reais)
  const revenueData: ChartData[] = [
    { name: 'Jan', value: 12000, change: 8.2 },
    { name: 'Fev', value: 15000, change: 25.0 },
    { name: 'Mar', value: 18000, change: 20.0 },
    { name: 'Abr', value: 22000, change: 22.2 },
    { name: 'Mai', value: 25000, change: 13.6 },
    { name: 'Jun', value: 28000, change: 12.0 },
  ];

  const clientGrowthData: ChartData[] = [
    { name: 'Jan', value: 45, change: 12.5 },
    { name: 'Fev', value: 52, change: 15.6 },
    { name: 'Mar', value: 61, change: 17.3 },
    { name: 'Abr', value: 68, change: 11.5 },
    { name: 'Mai', value: 75, change: 10.3 },
    { name: 'Jun', value: 82, change: 9.3 },
  ];

  const projectPerformanceData: ChartData[] = [
    { name: 'Concluídos', value: 24, change: 20.0 },
    { name: 'Em Andamento', value: 8, change: -10.0 },
    { name: 'Pausados', value: 3, change: -25.0 },
    { name: 'Cancelados', value: 2, change: -50.0 },
  ];

  const getCurrentData = () => {
    switch (selectedChart) {
      case 'revenue':
        return revenueData;
      case 'clients':
        return clientGrowthData;
      case 'projects':
        return projectPerformanceData;
      default:
        return revenueData;
    }
  };

  const getChartTitle = () => {
    switch (selectedChart) {
      case 'revenue':
        return 'Receitas por Período';
      case 'clients':
        return 'Crescimento de Clientes';
      case 'projects':
        return 'Performance de Projetos';
      default:
        return 'Analytics';
    }
  };

  const getMaxValue = () => {
    const data = getCurrentData();
    return Math.max(...data.map(d => d.value));
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      {/* Gráfico Principal */}
      <Card className="lg:col-span-2 rounded-3xl border-0 bg-gradient-to-br from-background to-muted/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">{getChartTitle()}</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedChart('revenue')}
                className={`p-2 rounded-xl transition-all ${
                  selectedChart === 'revenue' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <LineChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedChart('clients')}
                className={`p-2 rounded-xl transition-all ${
                  selectedChart === 'clients' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedChart('projects')}
                className={`p-2 rounded-xl transition-all ${
                  selectedChart === 'projects' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <PieChart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getCurrentData().map((item, index) => {
              const maxValue = getMaxValue();
              const percentage = (item.value / maxValue) * 100;
              const isPositive = (item.change || 0) >= 0;
              
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {selectedChart === 'revenue' ? `R$ ${item.value.toLocaleString()}` : item.value}
                      </span>
                      {item.change && (
                        <div className={`flex items-center gap-1 text-xs ${
                          isPositive ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(item.change)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Rápidas (padronizadas ao tema) */}
      <div className="space-y-4">
        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crescimento Mensal</p>
                <p className="text-2xl font-bold text-primary">+18.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-primary">R$ 1.2K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold text-primary">68%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}