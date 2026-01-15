import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Calendar, User, Palette, DollarSign, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ClientSelect } from "@/components/orcamentos/ClientSelect";
import { Cliente } from "@/services/clientes.service";

interface LeadOrcamentoFormProps {
    onSave?: () => void;
    orcamento?: {
        id: string;
        nome: string;
        numero: string;
        plataforma_contato: string;
        local_tatuagem?: string;
        tamanho?: number;
        estilo?: string;
        cor?: string;
        locais?: string[];
        quantidade_sessoes?: number;
        valor_por_sessao?: number;
        valor_total?: number;
        observacoes?: string;
        data_contato?: string;
    };
    trigger?: React.ReactNode;
}

export function LeadOrcamentoForm({ onSave, orcamento, trigger }: LeadOrcamentoFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Cliente selecionado
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

    // Dados do Lead
    const [nome, setNome] = useState("");
    const [numero, setNumero] = useState("");
    const [plataforma, setPlataforma] = useState<string>("");

    // Dados do Projeto
    const [tamanho, setTamanho] = useState("");
    const [estilos, setEstilos] = useState<string[]>([]);
    const [cor, setCor] = useState<string>("");
    const [locaisCorpo, setLocaisCorpo] = useState<string[]>([]);
    const [quantidadeSessoes, setQuantidadeSessoes] = useState("");
    const [valorPorSessao, setValorPorSessao] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [dataContato, setDataContato] = useState("");

    // Opções predefinidas para locais do corpo
    const locaisCorpoOptions = [
        "Braço",
        "Antebraço",
        "Perna",
        "Coxa",
        "Panturrilha",
        "Peito",
        "Costas",
        "Ombro",
        "Pescoço",
        "Mão",
        "Pé",
        "Barriga",
        "Costela",
        "Nuca",
        "Outro"
    ];

    // Opções de estilo
    const estiloOptions = [
        "Realismo",
        "Fineline",
        "Old School",
        "Blackwork",
        "Tribal",
        "Pontilhismo",
        "Geométrico",
        "Oriental",
        "Aquarela",
        "Lettering",
        "Sketch",
        "Minimalista",
        "Outro"
    ];

    // Cálculo automático do valor total
    const [valorTotal, setValorTotal] = useState(0);

    // Load existing data when editing
    useEffect(() => {
        if (orcamento) {
            setNome(orcamento.nome || "");
            setNumero(orcamento.numero || "");
            setPlataforma(orcamento.plataforma_contato || "");
            setTamanho(orcamento.tamanho ? String(orcamento.tamanho) : "");

            // Converter string de estilos separada por vírgula em array
            if (orcamento.estilo) {
                setEstilos(orcamento.estilo.split(',').map(s => s.trim()));
            } else {
                setEstilos([]);
            }

            setCor(orcamento.cor || "");
            setLocaisCorpo(orcamento.locais || []);
            setQuantidadeSessoes(orcamento.quantidade_sessoes ? String(orcamento.quantidade_sessoes) : "");
            setValorPorSessao(orcamento.valor_por_sessao ? String(orcamento.valor_por_sessao) : "");
            setObservacoes(orcamento.observacoes || "");
            setDataContato(orcamento.data_contato ? orcamento.data_contato.split('T')[0] : "");
        }
    }, [orcamento]);

    // Sync selected client data with form fields
    useEffect(() => {
        if (selectedCliente) {
            setNome(selectedCliente.nome);
            setNumero(selectedCliente.telefone || "");
        }
    }, [selectedCliente]);

    useEffect(() => {
        const sessoes = parseInt(quantidadeSessoes) || 0;
        const valorSessao = parseFloat(valorPorSessao) || 0;
        setValorTotal(sessoes * valorSessao);
    }, [quantidadeSessoes, valorPorSessao]);

    const handleSave = async () => {
        // Validações
        if (!selectedCliente) {
            toast({
                title: "Erro",
                description: "Selecione um cliente ou crie um novo lead",
                variant: "destructive"
            });
            return;
        }

        if (!plataforma) {
            toast({
                title: "Erro",
                description: "Selecione a plataforma de contato",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);

            if (orcamento?.id) {
                // Update existing budget
                const { error } = await supabase
                    .from('orcamentos')
                    .update({
                        nome,
                        numero,
                        plataforma_contato: plataforma,
                        tamanho: tamanho ? parseFloat(tamanho) : null,
                        estilo: estilos.length > 0 ? estilos.join(', ') : null,
                        cor: cor || null,
                        locais: locaisCorpo.length > 0 ? locaisCorpo : null,
                        quantidade_sessoes: quantidadeSessoes ? parseInt(quantidadeSessoes) : null,
                        valor_por_sessao: valorPorSessao ? parseFloat(valorPorSessao) : null,
                        valor_total: valorTotal || null,
                        observacoes: observacoes || null,
                        data_contato: dataContato || null,
                    })
                    .eq('id', orcamento.id);

                if (error) throw error;

                toast({
                    title: "Sucesso!",
                    description: "Orçamento atualizado com sucesso",
                });
            } else {
                // Create new budget
                const { data, error } = await supabase
                    .from('orcamentos')
                    .insert({
                        nome,
                        numero,
                        plataforma_contato: plataforma,
                        tamanho: tamanho ? parseFloat(tamanho) : null,
                        estilo: estilos.length > 0 ? estilos.join(', ') : null,
                        cor: cor || null,
                        locais: locaisCorpo.length > 0 ? locaisCorpo : null,
                        quantidade_sessoes: quantidadeSessoes ? parseInt(quantidadeSessoes) : null,
                        valor_por_sessao: valorPorSessao ? parseFloat(valorPorSessao) : null,
                        valor_total: valorTotal || null,
                        observacoes: observacoes || null,
                        status: 'pendente',
                        data_contato: dataContato || new Date().toISOString().split('T')[0]
                    })
                    .select()
                    .single();

                if (error) throw error;

                toast({
                    title: "Sucesso!",
                    description: "Lead/Orçamento criado com sucesso",
                });
            }

            // Reset form
            setNome("");
            setNumero("");
            setPlataforma("");
            setTamanho("");
            setEstilos([]);
            setCor("");
            setLocaisCorpo([]);
            setQuantidadeSessoes("");
            setValorPorSessao("");
            setObservacoes("");
            setDataContato("");
            setSelectedCliente(null);

            setOpen(false);
            onSave?.();

        } catch (error: any) {
            console.error('Erro ao salvar orçamento:', error);
            toast({
                title: "Erro",
                description: error.message || "Erro ao salvar orçamento",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button className="rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Lead/Orçamento
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white">
                <DialogHeader className="p-6 pb-2 border-b mb-4">
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {orcamento ? "Editar Orçamento" : "Novo Orçamento"}
                    </DialogTitle>
                    <DialogDescription>
                        {orcamento ? "Atualize as informações do orçamento abaixo" : "Preencha os dados do novo orçamento"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">

                    {/* Seção: Informações do Contato */}
                    <div className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
                        <h3 className="flex items-center gap-2 font-semibold text-slate-700">
                            <User className="h-4 w-4 text-primary" /> Informações do Contato
                        </h3>
                        <div className="space-y-4">
                            <ClientSelect
                                onSelect={setSelectedCliente}
                                selectedClienteId={selectedCliente?.id}
                            />

                            {selectedCliente && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="plataforma" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plataforma</Label>
                                        <Select value={plataforma} onValueChange={setPlataforma}>
                                            <SelectTrigger id="plataforma" className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                <SelectItem value="presencial">Presencial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="data-contato" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data do Contato</Label>
                                        <DatePickerInput
                                            value={dataContato}
                                            onChange={setDataContato}
                                            placeholder="Selecione data..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seção: Detalhes do Projeto */}
                    <div className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
                        <h3 className="flex items-center gap-2 font-semibold text-slate-700">
                            <Palette className="h-4 w-4 text-primary" /> Detalhes do Projeto
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locais do Corpo</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {locaisCorpoOptions.map((local) => (
                                        <div
                                            key={local}
                                            onClick={() => {
                                                if (locaisCorpo.includes(local)) {
                                                    setLocaisCorpo(locaisCorpo.filter(l => l !== local));
                                                } else {
                                                    setLocaisCorpo([...locaisCorpo, local]);
                                                }
                                            }}
                                            className={`
                                                flex items-center justify-center p-2 rounded-lg border text-sm cursor-pointer transition-all
                                                ${locaisCorpo.includes(local)
                                                    ? 'bg-primary/10 border-primary text-primary font-medium'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}
                                            `}
                                        >
                                            {local}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tamanho" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tamanho (cm)</Label>
                                    <div className="relative">
                                        <Input
                                            id="tamanho"
                                            type="number"
                                            placeholder="Ex: 15"
                                            value={tamanho}
                                            onChange={(e) => setTamanho(e.target.value)}
                                            className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all pr-8"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">cm</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="estilo" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estilo</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between rounded-xl bg-slate-50 border-slate-200 hover:bg-white text-left font-normal">
                                                <span className="truncate">
                                                    {estilos.length > 0 ? estilos.join(', ') : "Selecione..."}
                                                </span>
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto rounded-xl">
                                            {estiloOptions.map((option) => (
                                                <DropdownMenuCheckboxItem
                                                    key={option}
                                                    checked={estilos.includes(option)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setEstilos([...estilos, option]);
                                                        } else {
                                                            setEstilos(estilos.filter((e) => e !== option));
                                                        }
                                                    }}
                                                >
                                                    {option}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cor" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cor</Label>
                                    <Select value={cor} onValueChange={setCor}>
                                        <SelectTrigger id="cor" className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="pb">Preto e Branco</SelectItem>
                                            <SelectItem value="colorido">Colorido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção: Valores e Sessões */}
                    <div className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
                        <h3 className="flex items-center gap-2 font-semibold text-slate-700">
                            <DollarSign className="h-4 w-4 text-primary" /> Valores e Sessões
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sessoes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nº Sessões</Label>
                                <Input
                                    id="sessoes"
                                    type="number"
                                    placeholder="Ex: 3"
                                    value={quantidadeSessoes}
                                    onChange={(e) => setQuantidadeSessoes(e.target.value)}
                                    className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="valor-sessao" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Sessão</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-500">R$</span>
                                    <Input
                                        id="valor-sessao"
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={valorPorSessao}
                                        onChange={(e) => setValorPorSessao(e.target.value)}
                                        className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        {valorTotal > 0 && (
                            <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl shadow-lg mt-2">
                                <span className="font-medium">Valor Total Estimado</span>
                                <span className="text-2xl font-bold">
                                    {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Seção: Observações */}
                    <div className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
                        <h3 className="flex items-center gap-2 font-semibold text-slate-700">
                            <FileText className="h-4 w-4 text-primary" /> Observações
                        </h3>
                        <Textarea
                            id="observacoes"
                            placeholder="Detalhes adicionais sobre o projeto..."
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="rounded-xl min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 pt-2 border-t bg-white">
                    <Button
                        className="w-full h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            "Processando..."
                        ) : (
                            orcamento ? "Confirmar Alterações" : "Confirmar Orçamento"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
