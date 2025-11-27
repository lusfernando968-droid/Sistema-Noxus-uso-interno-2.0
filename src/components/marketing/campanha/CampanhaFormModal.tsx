import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { campanhaSchema, CampanhaRecord, CampanhaCanal, CampanhaStatus, CampanhaEstagioFunil } from "@/hooks/useCampanhas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target,
  Calendar,
  DollarSign,
  Users,
  Tag,
  FileText,
  Megaphone,
  TrendingUp,
  Info,
  Filter,
  Sparkles,
  Zap,
  Trophy
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: CampanhaRecord) => Promise<void> | void;
  editing?: CampanhaRecord | null;
};

const canais: CampanhaCanal[] = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'GOOGLE_ADS', 'ORGANICO', 'EMAIL'];
const statuses: CampanhaStatus[] = ['RASCUNHO', 'ATIVA', 'PAUSADA', 'ENCERRADA'];
const estagiosFunil: {
  value: CampanhaEstagioFunil;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
    {
      value: 'TOPO',
      label: 'Topo do Funil',
      description: 'Conscientização - Atrair e educar novos públicos',
      icon: Sparkles,
      color: 'text-blue-500'
    },
    {
      value: 'MEIO',
      label: 'Meio do Funil',
      description: 'Consideração - Nutrir leads e gerar interesse',
      icon: Zap,
      color: 'text-amber-500'
    },
    {
      value: 'FUNDO',
      label: 'Fundo do Funil',
      description: 'Conversão - Fechar vendas e converter clientes',
      icon: Trophy,
      color: 'text-green-500'
    },
  ];

// Função para formatar valor como moeda brasileira
const formatCurrency = (value: number | null | undefined): string => {
  if (!value && value !== 0) return "";
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função para converter string formatada em número
const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export default function CampanhaFormModal({ open, onOpenChange, onSubmit, editing }: Props) {
  const form = useForm<CampanhaRecord>({
    resolver: zodResolver(campanhaSchema as any),
    defaultValues: editing ? editing : {
      titulo: "",
      objetivo: "",
      publico_alvo: "",
      canal: 'INSTAGRAM',
      estagio_funil: null,
      orcamento: 0,
      data_inicio: new Date().toISOString().slice(0, 10),
      data_fim: new Date().toISOString().slice(0, 10),
      status: 'RASCUNHO',
      tags: [],
      notas: "",
    },
  });

  const [orcamentoDisplay, setOrcamentoDisplay] = useState<string>("");

  // Atualizar o display quando o formulário for resetado ou editando mudar
  useEffect(() => {
    const currentValue = form.watch("orcamento");
    setOrcamentoDisplay(formatCurrency(currentValue));
  }, [editing, open]);

  const handleOrcamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, ''); // Remove tudo exceto dígitos e vírgula
    setOrcamentoDisplay(value);
    const numericValue = parseCurrency(value);
    form.setValue("orcamento", numericValue);
  };

  const handleOrcamentoBlur = () => {
    const currentValue = form.watch("orcamento");
    setOrcamentoDisplay(formatCurrency(currentValue));
  };

  const handleSubmit = async (values: CampanhaRecord) => {
    await onSubmit({
      titulo: values.titulo,
      objetivo: values.objetivo ?? null,
      publico_alvo: values.publico_alvo ?? null,
      canal: values.canal,
      estagio_funil: values.estagio_funil ?? null,
      orcamento: values.orcamento ?? null,
      data_inicio: values.data_inicio ?? null,
      data_fim: values.data_fim ?? null,
      status: values.status,
      tags: values.tags ?? null,
      notas: values.notas ?? null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {editing ? <Info className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
            {editing ? "Editar campanha" : "Nova campanha"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            {/* Grupo: Informações Básicas */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" /> Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="titulo" control={form.control} render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Megaphone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Nome da campanha" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="canal" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-label="Selecionar canal">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {canais.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="status" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-label="Selecionar status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Grupo: Período e Orçamento */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Período e Orçamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="data_inicio" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="data_fim" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de término</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="orcamento" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={orcamentoDisplay}
                          onChange={handleOrcamentoChange}
                          onBlur={handleOrcamentoBlur}
                          placeholder="0,00"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Grupo: Estágio do Funil */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" /> Estágio do Funil
              </h3>
              <FormField name="estagio_funil" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Posição no Funil de Marketing</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Selecionar estágio do funil" className="h-auto min-h-[2.5rem]">
                        <SelectValue placeholder="Selecione o estágio...">
                          {field.value && (() => {
                            const selected = estagiosFunil.find(e => e.value === field.value);
                            if (!selected) return null;
                            const Icon = selected.icon;
                            return (
                              <div className="flex items-center gap-3 py-1">
                                <Icon className={`h-5 w-5 ${selected.color}`} />
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-sm">{selected.label}</span>
                                  <span className="text-xs text-muted-foreground">{selected.description}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {estagiosFunil.map(e => {
                        const Icon = e.icon;
                        return (
                          <SelectItem key={e.value} value={e.value} className="cursor-pointer">
                            <div className="flex items-center gap-3 py-2">
                              <Icon className={`h-5 w-5 ${e.color} flex-shrink-0`} />
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{e.label}</span>
                                <span className="text-xs text-muted-foreground leading-tight">{e.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Classifique sua campanha de acordo com o objetivo no funil de vendas
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Grupo: Objetivo e Público */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Objetivo e Público
              </h3>
              <FormField name="objetivo" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Target className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Ex.: Aumentar vendas, gerar leads..." className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="publico_alvo" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Público-alvo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Descreva o público-alvo" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Grupo: Detalhes Adicionais */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Detalhes Adicionais
              </h3>
              <FormField name="tags" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (separadas por vírgula)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ex.: verão, promoção, lançamento"
                        className="pl-9"
                        value={(field.value || []).join(", ")}
                        onChange={(e) => field.onChange(e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="notas" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Textarea placeholder="Observações adicionais" className="pl-9 min-h-[80px]" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar" : "Criar campanha"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
