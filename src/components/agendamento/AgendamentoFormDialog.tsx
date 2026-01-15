import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { Calendar, Plus, Clock, User, FileText, FlaskConical } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Agendamento, AgendamentoFormData, Cliente, Projeto, INITIAL_FORM_DATA } from "./types";
import { formatCurrencyBR, normalizeTime, clampTime } from "./utils";

interface AgendamentoFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AgendamentoFormData;
  setFormData: React.Dispatch<React.SetStateAction<AgendamentoFormData>>;
  editingAgendamento: Agendamento | null;
  clientes: Cliente[];
  projetos: Projeto[];
  onSubmit: () => void;
  onCancel: () => void;
  onVincularAnalise?: () => void;
}

export function AgendamentoFormDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  editingAgendamento,
  clientes,
  projetos,
  onSubmit,
  onCancel,
  onVincularAnalise,
  isSubmitting,
}: AgendamentoFormDialogProps & { isSubmitting?: boolean }) {
  const navigate = useNavigate();

  const handleTimeChange = (field: 'hora_inicio' | 'hora_fim', value: string) => {
    const valueNorm = normalizeTime(value);
    setFormData(prev => ({ ...prev, [field]: valueNorm }));
  };

  const handleTimeBlur = (field: 'hora_inicio' | 'hora_fim') => {
    setFormData(prev => {
      const clamped = clampTime(prev[field]);
      return { ...prev, [field]: clamped };
    });
  };

  const handleValorEstimadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    const cents = parseInt(digitsOnly || "0", 10);
    const value = cents / 100;
    setFormData(prev => ({ ...prev, valor_estimado: value }));
  };

  const projetosFiltrados = projetos.filter((p) => p.cliente_id === formData.cliente_id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        onCancel();
      }
    }}>
      <DialogTrigger asChild>
        <Button className="rounded-lg gap-2 h-9 px-3">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Agendamento</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            {editingAgendamento ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grupo: Informações do Cliente */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" /> Informações do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => {
                    const c = clientes.find((cl) => cl.id === value);
                    setFormData(prev => ({
                      ...prev,
                      cliente_id: value,
                      cliente_nome: c?.nome || "",
                      tatuador: "",
                      valor_estimado: 0
                    }));
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Projeto</Label>
                <Select
                  value={formData.tatuador}
                  onValueChange={(value) => {
                    const p = projetos.find((pr) => pr.titulo === value) || projetos.find((pr) => pr.id === value);
                    setFormData(prev => ({
                      ...prev,
                      tatuador: p?.titulo || value,
                      valor_estimado: typeof p?.valor_por_sessao === 'number' ? p.valor_por_sessao : prev.valor_estimado
                    }));
                  }}
                >
                  <SelectTrigger className="rounded-xl" disabled={!formData.cliente_id}>
                    <SelectValue placeholder={formData.cliente_id ? "Selecione o projeto" : "Selecione primeiro um cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projetosFiltrados.map((projeto) => (
                      <SelectItem key={projeto.id} value={projeto.titulo}>
                        {projeto.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.cliente_id && projetosFiltrados.length === 0 && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <span>Nenhum projeto para este cliente.</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl px-2"
                      onClick={() => navigate(`/projetos?cliente=${formData.cliente_id}`)}
                    >
                      Criar projeto
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grupo: Agendamento */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Agendamento
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Serviço</Label>
                <Select
                  value={formData.servico}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, servico: value }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Início de projeto">Início de projeto</SelectItem>
                    <SelectItem value="Continuação">Continuação</SelectItem>
                    <SelectItem value="Retoque">Retoque</SelectItem>
                    <SelectItem value="Orçamento">Orçamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start text-left font-normal rounded-xl"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.data_agendamento
                        ? format(
                          parse(formData.data_agendamento, "yyyy-MM-dd", new Date()),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )
                        : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComp
                      mode="single"
                      selected={formData.data_agendamento ? parse(formData.data_agendamento, "yyyy-MM-dd", new Date()) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ ...prev, data_agendamento: format(date, "yyyy-MM-dd") }));
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Hora Início</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="time"
                    step="60"
                    value={formData.hora_inicio}
                    onChange={(e) => handleTimeChange('hora_inicio', e.target.value)}
                    onBlur={() => handleTimeBlur('hora_inicio')}
                    className="rounded-xl pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Hora Fim</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="time"
                    step="60"
                    value={formData.hora_fim}
                    onChange={(e) => handleTimeChange('hora_fim', e.target.value)}
                    onBlur={() => handleTimeBlur('hora_fim')}
                    className="rounded-xl pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grupo: Detalhes */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Detalhes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Estimado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyBR(formData.valor_estimado)}
                    onChange={handleValorEstimadoChange}
                    placeholder="0,00"
                    className="rounded-xl pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Observações</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="rounded-xl pl-9 min-h-[80px]"
                    placeholder="Observações sobre o agendamento..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {editingAgendamento && formData.status === 'concluido' && onVincularAnalise && (
            <Button
              variant="outline"
              onClick={onVincularAnalise}
              className="rounded-xl gap-2 mr-auto"
              title="Vincular Análise de Custo"
            >
              <FlaskConical className="w-4 h-4" />
              Vincular Análise
            </Button>
          )}
          <Button variant="outline" onClick={onCancel} className="rounded-xl" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} className="rounded-xl" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : (editingAgendamento ? "Atualizar" : "Criar")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
