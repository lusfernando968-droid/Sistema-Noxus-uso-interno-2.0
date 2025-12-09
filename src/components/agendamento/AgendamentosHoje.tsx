import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FlaskConical } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Agendamento } from "./types";
import { getStatusColor, getStatusLabel, getTodayISO } from "./utils";

interface AgendamentosHojeProps {
  agendamentos: Agendamento[];
  onConfirmarSessao: (agendamento: Agendamento) => void;
  onVincularAnalise: (agendamento: Agendamento) => void;
}

export function AgendamentosHoje({ 
  agendamentos, 
  onConfirmarSessao, 
  onVincularAnalise 
}: AgendamentosHojeProps) {
  const hoje = getTodayISO();
  
  const agendamentosDoDia = agendamentos
    .filter(a => a.data_agendamento === hoje)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Agendamentos de Hoje</CardTitle>
        <CardDescription>Mostra apenas os compromissos do dia atual</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {agendamentosDoDia.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
        ) : (
          agendamentosDoDia.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {a.cliente_nome} — {a.servico}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {a.hora_inicio} - {a.hora_fim} • {format(parse(a.data_agendamento, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(a.status)}>
                {getStatusLabel(a.status)}
              </Badge>
              {a.status !== 'concluido' && a.status !== 'cancelado' && (
                <Button size="sm" className="ml-3 rounded-xl" onClick={() => onConfirmarSessao(a)}>
                  Confirmar Sessão
                </Button>
              )}
              {a.status === 'concluido' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-3 rounded-xl gap-2" 
                  onClick={() => onVincularAnalise(a)}
                >
                  <FlaskConical className="w-4 h-4" />
                  Vincular Análise
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

