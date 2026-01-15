import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, User, FlaskConical, Copy } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Agendamento, AgendamentoStatus } from "./types";
import { formatCurrencyBR, getStatusIconComponent } from "./utils";

interface AgendamentosTableProps {
  agendamentos: Agendamento[];
  onEdit: (agendamento: Agendamento) => void;
  onDuplicate: (agendamento: Agendamento) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: AgendamentoStatus) => void;
  onConfirmarSessao: (agendamento: Agendamento) => void;
  onVincularAnalise: (agendamento: Agendamento) => void;
}

export function AgendamentosTable({
  agendamentos,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onConfirmarSessao,
  onVincularAnalise,
}: AgendamentosTableProps) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agendamentos.map((agendamento) => {
              const StatusIcon = getStatusIconComponent(agendamento.status);
              return (
                <TableRow key={agendamento.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{agendamento.cliente_nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {format(parse(agendamento.data_agendamento, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {agendamento.hora_inicio} - {agendamento.hora_fim}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{agendamento.servico}</TableCell>
                  <TableCell>{agendamento.tatuador}</TableCell>
                  <TableCell>
                    <Select
                      value={agendamento.status}
                      onValueChange={(value) => onStatusChange(agendamento.id, value as AgendamentoStatus)}
                    >
                      <SelectTrigger className="w-32 rounded-xl">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatCurrencyBR(agendamento.valor_estimado)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(agendamento)}
                        className="rounded-xl"
                        title="Editar agendamento"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDuplicate(agendamento)}
                        className="rounded-xl"
                        title="Duplicar agendamento"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(agendamento.id)}
                        className="rounded-xl text-destructive"
                        title="Excluir agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {agendamento.status !== 'concluido' && agendamento.status !== 'cancelado' && (
                        <Button
                          variant="default"
                          onClick={() => onConfirmarSessao(agendamento)}
                          className="rounded-xl"
                        >
                          Confirmar Sessão
                        </Button>
                      )}
                      {agendamento.status === 'concluido' && (
                        <Button
                          variant="outline"
                          onClick={() => onVincularAnalise(agendamento)}
                          className="rounded-xl gap-2"
                          title="Vincular Análise de Custo"
                        >
                          <FlaskConical className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

