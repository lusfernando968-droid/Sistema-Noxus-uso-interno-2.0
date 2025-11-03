import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniLineChart } from "@/components/ui/MiniLineChart";
import { 
  GripVertical, 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  Clock,
  Percent,
  XCircle
} from "lucide-react";

interface Widget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'progress';
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  position: number;
  icon: any;
  color: string;
  bgColor: string;
  value?: string | number;
  change?: number;
  data?: any[];
  trendData?: number[];
}

interface DraggableWidgetsProps {
  transacoes: any[];
  clientes: any[];
  projetos: any[];
  agendamentos: any[];
}

  export function DraggableWidgets({ transacoes, clientes, projetos, agendamentos }: DraggableWidgetsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'clients-total',
      title: 'Total de Clientes',
      type: 'metric',
      size: 'small',
      visible: true,
      position: 1,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: clientes.length,
      change: 12.5,
      trendData: [20, 24, 23, 25, 28, 32]
    },
    {
      id: 'projects-active',
      title: 'Projetos Ativos',
      type: 'metric',
      size: 'small',
      visible: true,
      position: 2,
      icon: Briefcase,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: projetos.filter(p => p.status === 'em_andamento').length,
      change: 8.3,
      trendData: [6, 7, 8, 8, 9, 10]
    },
    {
      id: 'revenue-month',
      title: 'Receita do Mês',
      type: 'metric',
      size: 'medium',
      visible: true,
      position: 3,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: 'R$ 28.5K',
      change: 15.2,
      trendData: [18, 19, 21, 24, 26, 28]
    },
    {
      id: 'appointments-today',
      title: 'Agendamentos Hoje',
      type: 'metric',
      size: 'small',
      visible: true,
      position: 4,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: agendamentos.filter(a => a.status === 'agendado').length,
      change: -5.1,
      trendData: [5, 4, 6, 3, 2, 0]
    },
    {
      id: 'growth-chart',
      title: 'Crescimento Mensal',
      type: 'chart',
      size: 'large',
      visible: true,
      position: 5,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      data: [
        { name: 'Jan', value: 12000 },
        { name: 'Fev', value: 15000 },
        { name: 'Mar', value: 18000 },
        { name: 'Abr', value: 22000 },
        { name: 'Mai', value: 25000 },
        { name: 'Jun', value: 28000 },
      ]
    },
    {
      id: 'conversion-rate',
      title: 'Taxa de Conversão',
      type: 'progress',
      size: 'medium',
      visible: true,
      position: 6,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: '68%',
      change: 3.2
    },
    {
      id: 'cancellation-rate',
      title: 'Taxa de Cancelamento',
      type: 'progress',
      size: 'medium',
      visible: true,
      position: 7,
      icon: XCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: `${Math.round((agendamentos.filter(a => a.status === 'cancelado').length / Math.max(agendamentos.length, 1)) * 100)}%`,
      change: -1.3
    },
    {
      id: 'client-satisfaction',
      title: 'Satisfação do Cliente',
      type: 'progress',
      size: 'small',
      visible: false,
      position: 7,
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: '94%',
      change: 2.1
    },
    {
      id: 'service-distribution',
      title: 'Distribuição de Serviços',
      type: 'chart',
      size: 'medium',
      visible: false,
      position: 8,
      icon: PieChart,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      data: [
        { name: 'Tatuagens', value: 65 },
        { name: 'Retoques', value: 20 },
        { name: 'Consultas', value: 15 },
      ]
    },
    {
      id: 'projects-completed',
      title: 'Projetos Concluídos',
      type: 'metric',
      size: 'small',
      visible: false,
      position: 9,
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: projetos.filter(p => p.status === 'concluido').length,
      change: 4.5
    },
    {
      id: 'avg-project-time',
      title: 'Tempo Médio de Projeto',
      type: 'metric',
      size: 'small',
      visible: false,
      position: 10,
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: '32d',
      change: -1.2
    },
    {
      id: 'monthly-roi',
      title: 'ROI Mensal',
      type: 'progress',
      size: 'medium',
      visible: false,
      position: 11,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: '145%',
      change: 6.8
    },
    {
      id: 'retention-rate',
      title: 'Taxa de Retenção',
      type: 'progress',
      size: 'medium',
      visible: false,
      position: 12,
      icon: Percent,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      value: '92%',
      change: 1.9
    }
  ]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const moveWidget = (dragId: string, dropId: string) => {
    setWidgets(prev => {
      const dragged = prev.find(w => w.id === dragId);
      const target = prev.find(w => w.id === dropId);
      if (!dragged || !target || dragged.id === target.id) return prev;
      const from = dragged.position;
      const to = target.position;
      return prev.map(w => {
        if (!w.visible) return w;
        if (w.id === dragId) return { ...w, position: to };
        if (from < to) {
          // shift left range (from+1 .. to)
          if (w.position > from && w.position <= to) return { ...w, position: w.position - 1 };
        } else if (from > to) {
          // shift right range (to .. from-1)
          if (w.position < from && w.position >= to) return { ...w, position: w.position + 1 };
        }
        return w;
      });
    });
  };

  // Removido: pré-visualização de reordenação durante arrasto causava instabilidade visual

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      // cria um ghost leve
      const ghost = target.cloneNode(true) as HTMLElement;
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.opacity = '0.7';
      ghost.style.transform = 'scale(0.98)';
      ghost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.18)';
      ghost.style.filter = 'blur(6px) drop-shadow(0 12px 24px rgba(0,0,0,0.25))';
      ghost.style.pointerEvents = 'none';
      ghost.style.borderRadius = '1.5rem';
      document.body.appendChild(ghost);
      try {
        e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
      } catch {}
      setTimeout(() => {
        try { document.body.removeChild(ghost); } catch {}
      }, 0);
    }
  };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (id: string) => { if (draggingId) moveWidget(draggingId, id); setDraggingId(null); setDragOverId(null); };
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null); };

  const resetLayout = () => {
    setWidgets(prev => prev.map((widget, index) => ({
      ...widget,
      position: index + 1,
      visible: index < 6 // Mostrar apenas os primeiros 6 por padrão
    })));
  };

  const getGridClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      default:
        return 'col-span-1';
    }
  };

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.position - b.position);

  const renderWidget = (widget: Widget) => {
    const IconComponent = widget.icon;
    const isPositive = (widget.change || 0) >= 0;

    return (
      <Card 
        key={widget.id}
        draggable={isEditMode}
        onDragStart={(e) => handleDragStart(e, widget.id)}
        onDragOver={(e) => handleDragOver(e, widget.id)}
        onDrop={() => handleDrop(widget.id)}
        onDragEnd={handleDragEnd}
        className={`${getGridClass(widget.size)} relative rounded-3xl border-0 shadow-lg bg-gradient-to-br from-background to-muted/20 hover:shadow-xl ${draggingId ? 'transition-none' : 'transition-all duration-300'} group select-none ${
          isEditMode ? 'ring-2 ring-primary/20 cursor-grab active:cursor-grabbing' : ''
        } ${isEditMode && dragOverId === widget.id && draggingId !== widget.id ? 'ring-2 ring-primary/30' : ''} ${
          isEditMode && draggingId === widget.id ? 'opacity-70 scale-[0.98] shadow-2xl ring-2 ring-primary/30' : ''
        }`}
      >
        {isEditMode && dragOverId === widget.id && draggingId !== widget.id && (
          <div className="pointer-events-none absolute inset-1 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center text-xs text-primary">
            Soltar aqui
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl bg-primary/20`}>
                <IconComponent className={`w-4 h-4 text-primary`} />
              </div>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </div>
            {isEditMode && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                >
                  <EyeOff className="w-3 h-3" />
                </Button>
                <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {widget.type === 'metric' && (
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{widget.value}</span>
                {widget.change && (
                  <Badge 
                    variant={isPositive ? "default" : "destructive"}
                    className="text-xs rounded-full"
                  >
                    {isPositive ? '+' : ''}{widget.change}%
                  </Badge>
                )}
              </div>
              {widget.trendData && (
                <MiniLineChart 
                  data={widget.trendData}
                  height={44}
                  showArea={false}
                  baseline={false}
                  grid={false}
                  lineWidth={1.2}
                />
              )}
            </div>
          )}

          {widget.type === 'progress' && (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold">{widget.value}</span>
                {widget.change && (
                  <Badge 
                    variant={isPositive ? "default" : "destructive"}
                    className="text-xs rounded-full"
                  >
                    {isPositive ? '+' : ''}{widget.change}%
                  </Badge>
                )}
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${widget.color.replace('text-', 'from-')} to-${widget.color.replace('text-', '').replace('-600', '-400')}`}
                  style={{ width: widget.value }}
                />
              </div>
            </div>
          )}

          {widget.type === 'chart' && widget.data && (
            <div className="space-y-3">
              <MiniLineChart 
                data={widget.data.map((d: any) => Number(d.value))}
                height={56}
                grid={false}
                baseline={false}
                showArea={false}
                interactive={false}
                showDot={true}
                formatValue={(v) => `R$ ${(v / 1000).toFixed(1)}K`}
                lineWidth={1.2}
              
              />
              {widget.size === 'large' && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{widget.data[0]?.name}</span>
                  <span>{widget.data[widget.data.length - 1]?.name}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Widgets Personalizáveis</h2>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? 'Arraste para reorganizar ou clique no olho para ocultar' : 'Visualização personalizada do seu dashboard'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetLayout}
            className="rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="rounded-xl"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditMode ? 'Concluir' : 'Editar'}
          </Button>
        </div>
      </div>

      {/* Hidden Widgets (when in edit mode) */}
      {isEditMode && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Widgets Ocultos</h3>
          <div className="flex flex-wrap gap-2">
            {widgets.filter(w => !w.visible).map(widget => {
              const IconComponent = widget.icon;
              return (
                <Button
                  key={widget.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="rounded-xl"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {widget.title}
                  <Eye className="w-4 h-4 ml-2" />
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.map(renderWidget)}
      </div>
    </div>
  );
}