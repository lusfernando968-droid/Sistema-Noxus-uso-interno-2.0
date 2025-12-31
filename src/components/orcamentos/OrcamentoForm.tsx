import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calculator, Clock, DollarSign } from "lucide-react";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { ClientSelect } from "@/components/orcamentos/ClientSelect";
import { Cliente } from "@/services/clientes.service";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface OrcamentoFormProps {
    onSave?: (dados: {
        clienteId: string;
        clienteNome: string;
        tamanho: number;
        estilo: string;
        cor: string;
        locais: string[];
        tempoEstimado: number;
        valorEstimado: number;
    }) => void;
}

export function OrcamentoForm({ onSave }: OrcamentoFormProps) {
    const [open, setOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

    // Constantes de cálculo (podem vir do backend futuramente)
    const VALOR_HORA_BASE = 400; // R$ 400/h

    // Estados do formulário
    const [tamanho, setTamanho] = useState<string>("");
    const [estilo, setEstilo] = useState<string>("realismo");
    const [cor, setCor] = useState<string>("pb");
    const [locais, setLocais] = useState<string[]>([]);

    // Estados de resultado
    const [tempoEstimado, setTempoEstimado] = useState<number>(0);
    const [valorEstimado, setValorEstimado] = useState<number>(0);

    // Fatores
    const fatoresEstilo: Record<string, number> = {
        realismo: 2.0,
        fineline: 1.5,
        oldschool: 1.0,
        blackwork: 1.2,
        tribal: 0.9,
        aquarela: 1.4,
        oriental: 1.3
    };

    const fatoresCor: Record<string, number> = {
        pb: 1.0,
        colorido: 1.3
    };

    // Opções de local (exemplo)
    const locaisOpcoes: Option[] = [
        { label: "Antebraço", value: "antebraco" },
        { label: "Braço", value: "braco" },
        { label: "Perna", value: "perna" },
        { label: "Costas", value: "costas" },
        { label: "Peito", value: "peito" },
        { label: "Mão", value: "mao" },
        { label: "Pescoço", value: "pescoco" },
        { label: "Costela", value: "costela" },
    ];

    // Efeito para recalcular sempre que algo mudar
    useEffect(() => {
        const size = parseFloat(tamanho);

        if (!size || size <= 0) {
            setTempoEstimado(0);
            setValorEstimado(0);
            return;
        }

        const fatorEstilo = fatoresEstilo[estilo] || 1;
        const fatorCor = fatoresCor[cor] || 1;

        // Fator de local: Se tiver "costela" ou "pescoco", +20% de dificuldade/tempo
        let fatorLocal = 1.0;
        if (locais.includes("costela") || locais.includes("pescoco")) {
            fatorLocal = 1.2;
        }

        // Fórmula ajustada
        const pontuacao = size * fatorEstilo * fatorCor * fatorLocal;

        // Divisor experimental
        const divisor = 7;

        let horas = pontuacao / divisor;

        // Arredondar para 0.5 mais próximo ou min 0.5
        horas = Math.max(0.5, Math.ceil(horas * 2) / 2);

        const valor = horas * VALOR_HORA_BASE;

        setTempoEstimado(horas);
        setValorEstimado(valor);

    }, [tamanho, estilo, cor, locais]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Orçamento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Orçamento</DialogTitle>
                    <DialogDescription>
                        Preencha os dados abaixo para gerar uma estimativa automática.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <ClientSelect
                        onSelect={setSelectedCliente}
                        selectedClienteId={selectedCliente?.id}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="estilo">Estilo</Label>
                            <Select value={estilo} onValueChange={setEstilo}>
                                <SelectTrigger id="estilo" className="rounded-xl">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="realismo">Realismo</SelectItem>
                                    <SelectItem value="fineline">Fineline</SelectItem>
                                    <SelectItem value="oldschool">Old School</SelectItem>
                                    <SelectItem value="blackwork">Blackwork</SelectItem>
                                    <SelectItem value="tribal">Tribal</SelectItem>
                                    <SelectItem value="aquarela">Aquarela</SelectItem>
                                    <SelectItem value="oriental">Oriental</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cor</Label>
                        <RadioGroup
                            value={cor}
                            onValueChange={setCor}
                            className="flex gap-4"
                        >
                            <label
                                htmlFor="pb"
                                className={cn(
                                    "flex items-center space-x-2 border rounded-xl p-3 flex-1 cursor-pointer transition-colors",
                                    cor === 'pb' ? "border-primary bg-primary/5" : "hover:bg-secondary/50"
                                )}
                            >
                                <RadioGroupItem value="pb" id="pb" />
                                <span className={cn("font-medium", cor === 'pb' && "text-primary")}>Preto e Branco</span>
                            </label>

                            <label
                                htmlFor="colorido"
                                className={cn(
                                    "flex items-center space-x-2 border rounded-xl p-3 flex-1 cursor-pointer transition-colors",
                                    cor === 'colorido' ? "border-primary bg-primary/5" : "hover:bg-secondary/50"
                                )}
                            >
                                <RadioGroupItem value="colorido" id="colorido" />
                                <span className={cn("font-medium", cor === 'colorido' && "text-primary")}>Colorido</span>
                            </label>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Local do Corpo</Label>
                        <MultiSelect
                            options={locaisOpcoes}
                            selected={locais}
                            onChange={setLocais}
                            placeholder="Selecione os locais..."
                        />
                    </div>

                    {/* Resultado Automático */}
                    <Card className="bg-primary/5 border-primary/20 shadow-none rounded-xl">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Tempo Estimado</span>
                                    </div>
                                    <span className="text-2xl font-bold">{tempoEstimado}h</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-2 text-center border-l border-primary/10">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Valor Sugerido</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">
                                        {valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                        Cancelar
                    </Button>
                    <Button className="rounded-xl" onClick={() => {
                        if (!selectedCliente) {
                            toast({
                                title: "Erro",
                                description: "Selecione um cliente ou crie um lead.",
                                variant: "destructive"
                            });
                            return;
                        }
                        if (!tamanho || parseFloat(tamanho) <= 0) {
                            toast({
                                title: "Erro",
                                description: "Informe um tamanho válido.",
                                variant: "destructive"
                            });
                            return;
                        }

                        onSave?.({
                            clienteId: selectedCliente.id,
                            clienteNome: selectedCliente.nome,
                            tamanho: parseFloat(tamanho),
                            estilo,
                            cor,
                            locais,
                            tempoEstimado,
                            valorEstimado
                        });

                        toast({
                            title: "Sucesso",
                            description: "Orçamento salvo no registro.",
                        });
                        setOpen(false);

                        // Reset form
                        setTamanho("");
                        setLocais([]);
                        setSelectedCliente(null);
                    }}>
                        <Calculator className="w-4 h-4 mr-2" />
                        Salvar Orçamento
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
