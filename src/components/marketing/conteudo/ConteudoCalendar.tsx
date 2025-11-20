import { useState, useMemo } from 'react';
import { ConteudoItem } from '@/hooks/useConteudo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ConteudoCard } from './ConteudoCard';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";

interface ConteudoCalendarProps {
    items: ConteudoItem[];
    onDateChange: (id: string, date: Date) => void;
    onEdit: (item: ConteudoItem) => void;
}

export default function ConteudoCalendar({ items, onDateChange, onEdit }: ConteudoCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    // Navegação de mês
    const goToPreviousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
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

    // Agrupar itens por data
    const itemsByDate = useMemo(() => {
        const grouped: Record<string, ConteudoItem[]> = {};

        items.forEach(item => {
            if (!item.data_agendamento) return;
            // Usar data local para agrupamento
            const itemDate = new Date(item.data_agendamento);
            const year = itemDate.getFullYear();
            const month = String(itemDate.getMonth() + 1).padStart(2, '0');
            const day = String(itemDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(item);
        });

        // Ordenar itens por horário
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => {
                if (!a.data_agendamento || !b.data_agendamento) return 0;
                return new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime();
            });
        });

        return grouped;
    }, [items]);

    // Formatação de data
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';

        // Adicionar classe CSS para feedback visual
        setTimeout(() => {
            const draggedElement = document.querySelector(`[data-item-id="${id}"]`);
            if (draggedElement) {
                draggedElement.classList.add('dragging');
            }
        }, 0);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
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

    const handleDrop = (e: React.DragEvent, newDateStr: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');

        if (id && id !== draggedId) {
            return;
        }

        if (draggedId) {
            const item = items.find(i => i.id === draggedId);
            if (item) {
                // Preservar horário original
                const originalDate = item.data_agendamento ? new Date(item.data_agendamento) : new Date();

                // Criar nova data usando componentes locais para evitar conversão UTC indesejada
                const [year, month, day] = newDateStr.split('-').map(Number);
                const newDate = new Date(year, month - 1, day);

                // Restaurar horário original
                newDate.setHours(originalDate.getHours() || 9);
                newDate.setMinutes(originalDate.getMinutes() || 0);

                onDateChange(draggedId, newDate);
            }
        }

        setDraggedId(null);
        setDragOverDate(null);
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="space-y-6">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold capitalize">
                        {formatMonthYear(currentDate)}
                    </h2>
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
                            const dayItems = itemsByDate[dateString] || [];
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
                                        ${isDragOver ? 'bg-primary/10 ring-2 ring-inset ring-primary/20' : ''}
                                    `}
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
                                    </div>

                                    {/* Itens do dia */}
                                    <div className="space-y-1">
                                        {dayItems.slice(0, 3).map((item) => (
                                            <div
                                                key={item.id}
                                                data-item-id={item.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, item.id)}
                                                onDragEnd={handleDragEnd}
                                                onClick={(e) => e.stopPropagation()}
                                                className="transition-transform duration-200 hover:scale-105"
                                            >
                                                <ConteudoCard
                                                    item={item}
                                                    compact
                                                    draggable
                                                    isDragging={draggedId === item.id}
                                                    onClick={() => onEdit(item)}
                                                />
                                            </div>
                                        ))}

                                        {/* Indicador de mais itens */}
                                        {dayItems.length > 3 && (
                                            <div className="text-xs text-muted-foreground text-center py-1 transition-colors duration-200">
                                                +{dayItems.length - 3} mais
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
