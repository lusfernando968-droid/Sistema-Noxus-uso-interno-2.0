import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LeadOrcamentoFormProps {
    onSave?: () => void;
}

export function LeadOrcamentoForm({ onSave }: LeadOrcamentoFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Dados do Lead
    const [nome, setNome] = useState("");
    const [numero, setNumero] = useState("");
    const [plataforma, setPlataforma] = useState<string>("");

    // Dados do Projeto
    const [localTatuagem, setLocalTatuagem] = useState("");
    const [tamanho, setTamanho] = useState("");
    const [estilo, setEstilo] = useState("");
    const [cor, setCor] = useState<string>("");
    const [locais, setLocais] = useState<string[]>([]);
    const [quantidadeSessoes, setQuantidadeSessoes] = useState("");
    const [valorPorSessao, setValorPorSessao] = useState("");
    const [observacoes, setObservacoes] = useState("");

    // Cálculo automático do valor total
    const [valorTotal, setValorTotal] = useState(0);

    useEffect(() => {
        const sessoes = parseInt(quantidadeSessoes) || 0;
        const valorSessao = parseFloat(valorPorSessao) || 0;
        setValorTotal(sessoes * valorSessao);
    }, [quantidadeSessoes, valorPorSessao]);

    const handleSave = async () => {
        // Validações
        if (!nome.trim()) {
            toast({
                title: "Erro",
                description: "Nome é obrigatório",
                variant: "destructive"
            });
            return;
        }

        if (!numero.trim()) {
            toast({
                title: "Erro",
                description: "Número de contato é obrigatório",
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

            const { data, error } = await supabase
                .from('orcamentos')
                .insert({
                    nome,
                    numero,
                    plataforma_contato: plataforma,
                    local_tatuagem: localTatuagem || null,
                    tamanho: tamanho ? parseFloat(tamanho) : null,
                    estilo: estilo || null,
                    cor: cor || null,
                    locais: locais.length > 0 ? locais : null,
                    quantidade_sessoes: quantidadeSessoes ? parseInt(quantidadeSessoes) : null,
                    valor_por_sessao: valorPorSessao ? parseFloat(valorPorSessao) : null,
                    valor_total: valorTotal || null,
                    observacoes: observacoes || null,
                    status: 'pendente',
                    data_contato: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Lead/Orçamento criado com sucesso",
            });

            // Reset form
            setNome("");
            setNumero("");
            setPlataforma("");
            setLocalTatuagem("");
            setTamanho("");
            setEstilo("");
            setCor("");
            setLocais([]);
            setQuantidadeSessoes("");
            setValorPorSessao("");
            setObservacoes("");

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
            <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Lead/Orçamento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Lead/Orçamento</DialogTitle>
                    <DialogDescription>
                        Registre um novo contato e orçamento para rastreamento
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Dados do Lead */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Dados do Contato</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="nome">Nome *</Label>
                                <Input
                                    id="nome"
                                    placeholder="Nome do cliente"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="numero">Número *</Label>
                                <Input
                                    id="numero"
                                    placeholder="(00) 00000-0000"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="plataforma">Plataforma *</Label>
                                <Select value={plataforma} onValueChange={setPlataforma}>
                                    <SelectTrigger id="plataforma" className="rounded-xl">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="presencial">Presencial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Projeto */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Detalhes do Projeto</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="local">Local da Tatuagem</Label>
                                <Input
                                    id="local"
                                    placeholder="Ex: Braço, Perna..."
                                    value={localTatuagem}
                                    onChange={(e) => setLocalTatuagem(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tamanho">Tamanho (cm)</Label>
                                <Input
                                    id="tamanho"
                                    type="number"
                                    placeholder="Ex: 15"
                                    value={tamanho}
                                    onChange={(e) => setTamanho(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="estilo">Estilo</Label>
                                <Input
                                    id="estilo"
                                    placeholder="Ex: Realismo, Fineline..."
                                    value={estilo}
                                    onChange={(e) => setEstilo(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cor">Cor</Label>
                                <Select value={cor} onValueChange={setCor}>
                                    <SelectTrigger id="cor" className="rounded-xl">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="pb">Preto e Branco</SelectItem>
                                        <SelectItem value="colorido">Colorido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="locais">Locais do Corpo</Label>
                                <Input
                                    id="locais"
                                    placeholder="Ex: Braço, Perna (separados por vírgula)"
                                    value={locais.join(', ')}
                                    onChange={(e) => setLocais(e.target.value.split(',').map(l => l.trim()).filter(l => l))}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sessoes">Quantidade de Sessões</Label>
                                <Input
                                    id="sessoes"
                                    type="number"
                                    placeholder="Ex: 3"
                                    value={quantidadeSessoes}
                                    onChange={(e) => setQuantidadeSessoes(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="valor-sessao">Valor por Sessão (R$)</Label>
                                <Input
                                    id="valor-sessao"
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 500.00"
                                    value={valorPorSessao}
                                    onChange={(e) => setValorPorSessao(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            {valorTotal > 0 && (
                                <div className="col-span-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Valor Total:</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="observacoes">Observações</Label>
                                <Textarea
                                    id="observacoes"
                                    placeholder="Detalhes adicionais sobre o projeto..."
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    className="rounded-xl min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                        Cancelar
                    </Button>
                    <Button
                        className="rounded-xl"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Salvando..." : "Salvar Lead"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
