import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, Scissors } from "lucide-react";

interface Agendamento {
  id: string;
  cliente_nome: string;
  cliente_id: string;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
  servico: string;
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  observacoes: string;
  valor_estimado: number;
  tatuador: string;
  local: string;
}

interface AppointmentCardProps {
  appointment: Agendamento;
  onClick?: () => void;
  compact?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
}

export function AppointmentCard({ 
  appointment, 
  onClick, 
  compact = false, 
  draggable = false,
  isDragging = false 
}: AppointmentCardProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': 
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-700 dark:text-blue-300',
          bgLight: 'bg-blue-50 dark:bg-blue-950/50',
          border: 'border-blue-200 dark:border-blue-800'
        };
      case 'confirmado': 
        return {
          bg: 'bg-green-500',
          text: 'text-green-700 dark:text-green-300',
          bgLight: 'bg-green-50 dark:bg-green-950/50',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'em_andamento': 
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-700 dark:text-yellow-300',
          bgLight: 'bg-yellow-50 dark:bg-yellow-950/50',
          border: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'concluido': 
        return {
          bg: 'bg-purple-500',
          text: 'text-purple-700 dark:text-purple-300',
          bgLight: 'bg-purple-50 dark:bg-purple-950/50',
          border: 'border-purple-200 dark:border-purple-800'
        };
      case 'cancelado': 
        return {
          bg: 'bg-red-500',
          text: 'text-red-700 dark:text-red-300',
          bgLight: 'bg-red-50 dark:bg-red-950/50',
          border: 'border-red-200 dark:border-red-800'
        };
      default: 
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-700 dark:text-gray-300',
          bgLight: 'bg-gray-50 dark:bg-gray-950/50',
          border: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  const statusColors = getStatusColor(appointment.status);

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove segundos se houver
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'confirmado': return 'Confirmado';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  if (compact) {
    return (
      <div
        className={`
          relative p-2 rounded-lg border-l-4 cursor-pointer
          transition-all duration-200 hover:shadow-sm
          ${statusColors.bgLight} ${statusColors.border}
          ${isDragging ? 'opacity-50 scale-95' : ''}
          ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{ borderLeftColor: statusColors.bg.replace('bg-', '') }}
        onClick={onClick}
      >
        {/* Indicador de status */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColors.bg} rounded-l-lg`} />
        
        {/* Conteúdo compacto */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${statusColors.text}`}>
              {formatTime(appointment.hora_inicio)}
            </span>
            <div className={`w-2 h-2 rounded-full ${statusColors.bg}`} />
          </div>
          
          <div className="text-xs font-medium text-foreground truncate">
            {appointment.cliente_nome}
          </div>
          
          <div className="text-xs text-muted-foreground truncate">
            {appointment.servico}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-lg
        ${statusColors.border} ${statusColors.bgLight}
        ${isDragging ? 'opacity-50 scale-95 rotate-2' : ''}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header com status e horário */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="outline" 
            className={`${statusColors.text} ${statusColors.border} ${statusColors.bgLight}`}
          >
            <div className={`w-2 h-2 rounded-full ${statusColors.bg} mr-2`} />
            {getStatusLabel(appointment.status)}
          </Badge>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatTime(appointment.hora_inicio)} - {formatTime(appointment.hora_fim)}</span>
          </div>
        </div>

        {/* Informações principais */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{appointment.cliente_nome}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{appointment.servico}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">{appointment.local}</span>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tatuador: {appointment.tatuador}</span>
            <span className="font-medium text-foreground">
              R$ {appointment.valor_estimado.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Observações (se houver) */}
        {appointment.observacoes && (
          <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
            {appointment.observacoes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}