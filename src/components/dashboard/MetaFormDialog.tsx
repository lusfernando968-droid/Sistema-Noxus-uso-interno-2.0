import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Calendar as CalendarIcon, 
  Save, 
  X, 
  Palette,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  BarChart3,
  User,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMetas, MetaComProgresso, CreateMetaData, UpdateMetaData } from "@/hooks/useMetas";
import { cn } from "@/lib/utils";

interface MetaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta?: MetaComProgresso | null;
  mode: 'create' | 'edit' | 'progress';
}

const CORES_PREDEFINIDAS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#84CC16', // Lime
];

const CATEGORIAS = [
  { value: 'financeiro', label: 'Financeiro', icon: '💰', description: 'Metas relacionadas a receitas, despesas e lucro' },
  { value: 'clientes', label: 'Clientes', icon: '👥', description: 'Metas de aquisição, retenção e satisfação' },
  { value: 'projetos', label: 'Projetos', icon: '📋', description: 'Metas de entrega, qualidade e produtividade' },
  { value: 'vendas', label: 'Vendas', icon: '📈', description: 'Metas de vendas, conversão e pipeline' },
  { value: 'pessoal', label: 'Pessoal', icon: '🎯', description: 'Metas de desenvolvimento e aprendizado' },
  { value: 'operacional', label: 'Operacional', icon: '⚙️', description: 'Metas de eficiência e processos' },
];

const TIPOS = [
  { value: 'valor', label: 'Valor Monetário', icon: DollarSign, description: 'Ex: R$ 10.000' },
  { value: 'quantidade', label: 'Quantidade', icon: BarChart3, description: 'Ex: 50 clientes' },
  { value: 'percentual', label: 'Percentual', icon: TrendingUp, description: 'Ex: 95% satisfação' },
];

const UNIDADES_POR_TIPO = {
  valor: ['R$', 'USD', 'EUR'],
  quantidade: ['unidades', 'clientes', 'projetos', 'vendas', 'leads', 'contratos'],
  percentual: ['%', 'pontos', 'estrelas'],
};

export function MetaFormDialog({ open, onOpenChange, meta, mode }: MetaFormDialogProps) {
  const { createMeta, updateMeta, updateProgresso } = useMetas();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState<CreateMetaData>({
    titulo: '',
    descricao: '',
    categoria: 'financeiro',
    tipo: 'valor',
    valor_meta: 0,
    unidade: 'R$',
    data_inicio: format(new Date(), 'yyyy-MM-dd'),
    data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    prioridade: 'media',
    cor: CORES_PREDEFINIDAS[0],
  });

  // Estados para modo de progresso
  const [novoProgresso, setNovoProgresso] = useState(0);
  const [observacaoProgresso, setObservacaoProgresso] = useState('');

  // Estados para calendário
  const [dataInicioOpen, setDataInicioOpen] = useState(false);
  const [dataFimOpen, setDataFimOpen] = useState(false);

  // Carregar dados da meta para edição
  useEffect(() => {
    if (meta && (mode === 'edit' || mode === 'progress')) {
      setFormData({
        titulo: meta.titulo,
        descricao: meta.descricao || '',
        categoria: meta.categoria,
        tipo: meta.tipo,
        valor_meta: meta.valor_meta,
        unidade: meta.unidade,
        data_inicio: meta.data_inicio,
        data_fim: meta.data_fim,
        prioridade: meta.prioridade,
        cor: meta.cor,
      });
      setNovoProgresso(meta.valor_atual);
    } else if (mode === 'create') {
      // Reset para criação
      setFormData({
        titulo: '',
        descricao: '',
        categoria: 'financeiro',
        tipo: 'valor',
        valor_meta: 0,
        unidade: 'R$',
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        prioridade: 'media',
        cor: CORES_PREDEFINIDAS[0],
      });
      setNovoProgresso(0);
      setObservacaoProgresso('');
    }
  }, [meta, mode, open]);

  // Atualizar unidade quando tipo muda
  useEffect(() => {
    const unidadesDisponiveis = UNIDADES_POR_TIPO[formData.tipo];
    if (unidadesDisponiveis && !unidadesDisponiveis.includes(formData.unidade)) {
      setFormData(prev => ({ ...prev, unidade: unidadesDisponiveis[0] }));
    }
  }, [formData.tipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'create') {
        await createMeta(formData);
      } else if (mode === 'edit' && meta) {
        await updateMeta(meta.id, formData);
      } else if (mode === 'progress' && meta) {
        await updateProgresso(meta.id, novoProgresso, observacaoProgresso);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calcularPercentualProgresso = () => {
    if (formData.valor_meta === 0) return 0;
    return Math.min((novoProgresso / formData.valor_meta) * 100, 100);
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Nova Meta';
      case 'edit': return 'Editar Meta';
      case 'progress': return 'Atualizar Progresso';
      default: return 'Meta';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'progress' ? (
            // Modo de atualização de progresso
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/50">
                <h3 className="font-semibold mb-2">{meta?.titulo}</h3>
                <p className="text-sm text-muted-foreground mb-4">{meta?.descricao}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso atual:</span>
                    <span className="font-medium">
                      {meta?.valor_atual.toLocaleString()} / {meta?.valor_meta.toLocaleString()} {meta?.unidade}
                    </span>
                  </div>
                  <Progress value={meta?.percentual_progresso || 0} className="h-2" />
                  <div className="text-center text-sm text-muted-foreground">
                    {meta?.percentual_progresso.toFixed(0)}% concluído
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="novo-progresso">Novo Valor</Label>
                  <Input
                    id="novo-progresso"
                    type="number"
                    value={novoProgresso}
                    onChange={(e) => setNovoProgresso(Number(e.target.value))}
                    className="rounded-xl"
                    min="0"
                    step="0.01"
                  />
                  <div className="mt-2 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Novo progresso:</span>
                      <span className="font-medium" style={{ color: meta?.cor }}>
                        {calcularPercentualProgresso().toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={calcularPercentualProgresso()} 
                      className="h-2"
                      style={{ '--progress-background': meta?.cor } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacao">Observação (opcional)</Label>
                  <Textarea
                    id="observacao"
                    value={observacaoProgresso}
                    onChange={(e) => setObservacaoProgresso(e.target.value)}
                    placeholder="Adicione uma observação sobre este progresso..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Modo de criação/edição
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl">
                <TabsTrigger value="basico" className="rounded-lg">Básico</TabsTrigger>
                <TabsTrigger value="detalhes" className="rounded-lg">Detalhes</TabsTrigger>
                <TabsTrigger value="visual" className="rounded-lg">Visual</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título da Meta *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Aumentar receita mensal"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva sua meta em detalhes..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria *</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <div>
                                <div className="font-medium">{cat.label}</div>
                                <div className="text-xs text-muted-foreground">{cat.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prioridade</Label>
                    <Select 
                      value={formData.prioridade} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, prioridade: value }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="baixa">🟢 Baixa</SelectItem>
                        <SelectItem value="media">🔵 Média</SelectItem>
                        <SelectItem value="alta">🟠 Alta</SelectItem>
                        <SelectItem value="critica">🔴 Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="detalhes" className="space-y-4">
                <div>
                  <Label>Tipo de Meta *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {TIPOS.map((tipo) => {
                      const Icon = tipo.icon;
                      return (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tipo: tipo.value as any }))}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all text-left",
                            formData.tipo === tipo.value
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-muted-foreground/50"
                          )}
                        >
                          <Icon className="w-5 h-5 mb-2" />
                          <div className="font-medium text-sm">{tipo.label}</div>
                          <div className="text-xs text-muted-foreground">{tipo.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="valor-meta">Valor da Meta *</Label>
                    <Input
                      id="valor-meta"
                      type="number"
                      value={formData.valor_meta}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_meta: Number(e.target.value) }))}
                      className="rounded-xl"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <Label>Unidade</Label>
                    <Select 
                      value={formData.unidade} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, unidade: value }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {UNIDADES_POR_TIPO[formData.tipo].map((unidade) => (
                          <SelectItem key={unidade} value={unidade}>
                            {unidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Progresso Atual</Label>
                    <div className="text-sm text-muted-foreground mt-2">
                      {mode === 'edit' ? `${meta?.valor_atual || 0} ${formData.unidade}` : '0'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Início *</Label>
                    <Popover open={dataInicioOpen} onOpenChange={setDataInicioOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal rounded-xl"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data_inicio ? format(new Date(formData.data_inicio), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.data_inicio ? new Date(formData.data_inicio) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData(prev => ({ ...prev, data_inicio: format(date, 'yyyy-MM-dd') }));
                              setDataInicioOpen(false);
                            }
                          }}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Data de Término *</Label>
                    <Popover open={dataFimOpen} onOpenChange={setDataFimOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal rounded-xl"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data_fim ? format(new Date(formData.data_fim), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.data_fim ? new Date(formData.data_fim) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData(prev => ({ ...prev, data_fim: format(date, 'yyyy-MM-dd') }));
                              setDataFimOpen(false);
                            }
                          }}
                          locale={ptBR}
                          disabled={(date) => formData.data_inicio ? date < new Date(formData.data_inicio) : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visual" className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Cor da Meta
                  </Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {CORES_PREDEFINIDAS.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cor }))}
                        className={cn(
                          "w-12 h-12 rounded-xl border-2 transition-all",
                          formData.cor === cor ? "border-foreground scale-110" : "border-muted"
                        )}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <Label className="text-sm font-medium">Preview da Meta</Label>
                  <div className="mt-3 p-4 rounded-xl bg-background border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{formData.titulo || 'Título da meta'}</h3>
                      <Badge style={{ backgroundColor: formData.cor, color: 'white' }} className="text-xs">
                        {formData.prioridade}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>0 / {formData.valor_meta.toLocaleString()} {formData.unidade}</span>
                        <span style={{ color: formData.cor }}>0%</span>
                      </div>
                      <Progress 
                        value={0} 
                        className="h-2"
                        style={{ '--progress-background': formData.cor } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Meta' : mode === 'edit' ? 'Salvar Alterações' : 'Atualizar Progresso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}