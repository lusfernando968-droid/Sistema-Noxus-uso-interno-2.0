import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppointmentCard } from "./AppointmentCard";
import { useSoundEffects } from "@/hooks/useSoundEffects";

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

interface CalendarViewProps {
  appointments: Agendamento[];
  onAppointmentMove?: (appointmentId: string, newDate: string) => void;
  onAppointmentClick?: (appointment: Agendamento) => void;
  onDateClick?: (date: string) => void;
}

export function CalendarView({ 
  appointments, 
  onAppointmentMove, 
  onAppointmentClick, 
  onDateClick 
}: CalendarViewProps) {
  const { playSound } = useSoundEffects();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedAppointment, setDraggedAppointment] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Navegação de mês
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    playSound('whoosh');
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    playSound('whoosh');
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    playSound('chime');
  };

  // Gerar dados do calendário
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    // Primeiro dia da semana (domingo = 0)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Último dia da semana
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Agrupar agendamentos por data
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Agendamento[]> = {};
    
    appointments.forEach(appointment => {
      const date = appointment.data_agendamento;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    
    // Ordenar agendamentos por horário
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    });
    
    return grouped;
  }, [appointments]);

  // Formatação de data
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date);
    onDateClick?.(dateString);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, appointmentId: string) => {
    setDraggedAppointment(appointmentId);
    e.dataTransfer.setData('text/plain', appointmentId);
    e.dataTransfer.effectAllowed = 'move';
    playSound('drag');
    
    // Adicionar classe CSS para feedback visual
    setTimeout(() => {
      const draggedElement = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
      if (draggedElement) {
        draggedElement.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverDate(null);
    
    // Remover classe CSS
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Só remove o dragOver se realmente saiu do elemento
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newDate: string) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData('text/plain');
    
    if (appointmentId && appointmentId !== draggedAppointment) {
      return;
    }
    
    if (draggedAppointment && onAppointmentMove) {
      onAppointmentMove(draggedAppointment, newDate);
      playSound('drop');
    }
    
    setDraggedAppointment(null);
    setDragOverDate(null);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold capitalize">
            {formatMonthYear(currentDate)}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="rounded-xl"
          >
            Hoje
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid do Calendário */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header dos dias da semana */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-4 text-center font-medium text-muted-foreground bg-muted/30"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid dos dias */}
          <div className="grid grid-cols-7">
            {calendarData.map((date, index) => {
              const dateString = formatDate(date);
              const dayAppointments = appointmentsByDate[dateString] || [];
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              const isDragOver = dragOverDate === dateString;

              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] border-r border-b p-2 cursor-pointer group
                    transition-all duration-200 ease-in-out
                    ${!isCurrentMonthDay ? 'bg-muted/20 text-muted-foreground' : 'hover:bg-muted/50'}
                    ${isTodayDate ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' : ''}
                    ${isDragOver ? '' : ''}
                  `}
                  onClick={() => handleDateClick(date)}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={(e) => handleDragLeave(e)}
                  onDrop={(e) => handleDrop(e, dateString)}
                >
                  {/* Número do dia */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`
                        text-sm font-medium transition-all duration-200
                        ${isTodayDate ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                        ${!isCurrentMonthDay ? 'text-muted-foreground' : ''}
                      `}
                    >
                      {date.getDate()}
                    </span>
                    
                    {/* Botão de adicionar agendamento */}
                    {isCurrentMonthDay && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateClick(date);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Agendamentos do dia */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        data-appointment-id={appointment.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment.id)}
                        onDragEnd={handleDragEnd}
                        className="transition-transform duration-200 hover:scale-105"
                      >
                        <AppointmentCard
                          appointment={appointment}
                          onClick={() => onAppointmentClick?.(appointment)}
                          compact
                          draggable
                          isDragging={draggedAppointment === appointment.id}
                        />
                      </div>
                    ))}
                    
                    {/* Indicador de mais agendamentos */}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-1 transition-colors duration-200">
                        +{dayAppointments.length - 3} mais
                      </div>
                    )}
                  </div>

                  {/* Removido indicador de zona de drop para alinhar com o comportamento do Kanban de Projetos */}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legenda de Status */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Agendado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Cancelado</span>
        </div>
      </div>


    </div>
  );
}