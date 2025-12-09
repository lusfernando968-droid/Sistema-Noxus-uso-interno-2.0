import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { Agendamento } from "./types";
import { getTodayISO } from "./utils";

interface AgendamentosMetricsProps {
  agendamentos: Agendamento[];
}

export function AgendamentosMetrics({ agendamentos }: AgendamentosMetricsProps) {
  const hoje = getTodayISO();
  
  const totalAgendamentos = agendamentos.length;
  const agendamentosHoje = agendamentos.filter(a => a.data_agendamento === hoje).length;
  const agendamentosConfirmados = agendamentos.filter(a => a.status === 'confirmado').length;
  const agendamentosConcluidos = agendamentos.filter(a => a.status === 'concluido').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalAgendamentos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Hoje</p>
              <p className="text-2xl font-bold text-primary">{agendamentosHoje}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Confirmados</p>
              <p className="text-2xl font-bold text-primary">{agendamentosConfirmados}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Concluídos</p>
              <p className="text-2xl font-bold text-primary">{agendamentosConcluidos}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

