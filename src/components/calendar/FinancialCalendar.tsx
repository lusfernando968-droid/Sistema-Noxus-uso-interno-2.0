import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type TipoTransacao = "RECEITA" | "DESPESA";

interface Transacao {
  id: string;
  tipo: TipoTransacao;
  categoria: string;
  valor: number;
  data_vencimento: string;
  data_liquidacao: string | null;
  descricao: string;
}

interface FinancialCalendarProps {
  transacoes: Transacao[];
  onTransacaoClick?: (t: Transacao) => void;
  onDateClick?: (date: string) => void;
}

export function FinancialCalendar({ transacoes, onTransacaoClick, onDateClick }: FinancialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: Date[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isCurrentMonthDay = (d: Date) => d.getMonth() === currentDate.getMonth();
  const monthLabel = useMemo(
    () => currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    [currentDate]
  );

  const transacoesByDate = useMemo(() => {
    const grouped: Record<string, Transacao[]> = {};
    transacoes.forEach((t) => {
      const key = t.data_vencimento;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
    Object.keys(grouped).forEach((k) => {
      grouped[k].sort((a, b) => Number(b.valor) - Number(a.valor));
    });
    return grouped;
  }, [transacoes]);

  const getTipoClasses = (tipo: TipoTransacao, liquidada: boolean) => {
    if (tipo === "RECEITA") {
      return liquidada
        ? "bg-success/10 text-success border-success/20"
        : "bg-success/10 text-success border-success/20";
    }
    return liquidada
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold capitalize">{monthLabel}</h1>
          <Button variant="outline" size="sm" onClick={goToToday} className="rounded-xl">
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="p-4 text-center font-medium text-muted-foreground bg-muted/30">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((date, idx) => {
              const dateString = formatDate(date);
              const items = transacoesByDate[dateString] || [];
              const today = isToday(date);
              const currentMonth = isCurrentMonthDay(date);
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] border-r border-b p-2 transition-all duration-200 ${
                    currentMonth ? "hover:bg-muted/50" : "bg-muted/20 text-muted-foreground"
                  } ${today ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800" : ""}`}
                  onClick={() => onDateClick?.(dateString)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        today ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""
                      } ${!currentMonth ? "text-muted-foreground" : ""}`}
                    >
                      {date.getDate()}
                    </span>
                    {currentMonth && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateClick?.(dateString);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {items.slice(0, 3).map((t) => (
                      <div key={t.id} className="transition-transform duration-200 hover:scale-105">
                        <div
                          className={`flex items-center justify-between rounded-lg border px-2 py-1 text-xs ${getTipoClasses(
                            t.tipo,
                            Boolean(t.data_liquidacao)
                          )}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTransacaoClick?.(t);
                          }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Badge variant="outline" className="rounded-full px-1 text-[10px]">
                              {t.tipo}
                            </Badge>
                            <span className="truncate">{t.categoria}</span>
                          </div>
                          <span className="font-medium">
                            R$ {Number(t.valor).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {items.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-1">+{items.length - 3} mais</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Despesas</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full px-2">Liquidada</Badge>
          <span className="text-muted-foreground">quando aplicável</span>
        </div>
      </div>
    </div>
  );
}