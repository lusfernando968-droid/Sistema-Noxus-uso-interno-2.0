import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnaliseCusto, AnaliseCustoRecord } from "@/hooks/useAnaliseCusto";
import { useProdutos } from "@/hooks/useProdutos";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle, Trash2, History, Calculator, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AnaliseCusto() {
    const { analises, loading, iniciarAnalise, finalizarAnalise, excluirAnalise } = useAnaliseCusto();
    const { produtos } = useProdutos();

    const [isNewOpen, setIsNewOpen] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
    const [custoManual, setCustoManual] = useState<string>("");

    const ativos = analises.filter(a => a.status === 'ativo');
    const historico = analises.filter(a => a.status === 'concluido');

    const handleIniciar = async () => {
        if (!selectedMaterialId || !custoManual) return;
        const produto = produtos.find(p => p.id === selectedMaterialId);
        if (!produto) return;

        const custo = parseFloat(custoManual.replace(',', '.')) || 0;
        await iniciarAnalise(produto.nome, custo);
        setIsNewOpen(false);
        setSelectedMaterialId("");
        setCustoManual("");
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Análise de Bancada</h2>
                    <p className="text-muted-foreground">Monitore o rendimento real dos seus materiais por sessão.</p>
                </div>
                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Nova Análise
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Iniciar Análise de Custo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Selecione o Produto</Label>
                                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um produto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {produtos.map(p => (
                                            <SelectItem key={p.id} value={p.id || ""}>
                                                {p.nome} {p.marca ? `- ${p.marca}` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Escolha um produto novo que você vai começar a usar agora.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Custo do Produto (R$)</Label>
                                <Input
                                    type="text"
                                    placeholder="Ex: 150.00"
                                    value={custoManual}
                                    onChange={(e) => setCustoManual(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Digite quanto você pagou por este produto.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleIniciar} disabled={!selectedMaterialId || !custoManual}>
                                Iniciar Monitoramento
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Ativos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ativos.length === 0 && (
                    <Alert className="col-span-full bg-muted/50 border-dashed">
                        <Calculator className="h-4 w-4" />
                        <AlertTitle>Nenhuma análise em andamento</AlertTitle>
                        <AlertDescription>
                            Inicie uma nova análise para descobrir quanto custa cada sessão usando seus materiais.
                        </AlertDescription>
                    </Alert>
                )}
                {ativos.map(analise => {
                    const custoPorSessao = analise.qtd_sessoes > 0
                        ? analise.custo_produto / analise.qtd_sessoes
                        : analise.custo_produto;

                    return (
                        <Card key={analise.id} className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{analise.nome_produto}</CardTitle>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-0">Em uso</Badge>
                                </div>
                                <CardDescription>
                                    Iniciado em {format(new Date(analise.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="bg-muted p-2 rounded-md">
                                            <div className="text-xs text-muted-foreground">Sessões</div>
                                            <div className="text-2xl font-bold">{analise.qtd_sessoes}</div>
                                        </div>
                                        <div className="bg-muted p-2 rounded-md">
                                            <div className="text-xs text-muted-foreground">Custo/Sessão</div>
                                            <div className="text-xl font-bold text-primary">
                                                {formatCurrency(custoPorSessao)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Custo Total: {formatCurrency(analise.custo_produto)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="w-full text-destructive hover:text-destructive"
                                            onClick={() => excluirAnalise(analise.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Cancelar
                                        </Button>
                                        <Button
                                            className="w-full"
                                            onClick={() => finalizarAnalise(analise.id)}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" /> Finalizar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Histórico */}
            {historico.length > 0 && (
                <div className="space-y-4 pt-8">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="h-5 w-5" /> Histórico de Análises
                    </h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-center">Sessões</TableHead>
                                    <TableHead className="text-right">Custo Total</TableHead>
                                    <TableHead className="text-right">Custo/Sessão</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historico.map(analise => (
                                    <TableRow key={analise.id}>
                                        <TableCell className="font-medium">{analise.nome_produto}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(analise.data_inicio), "dd/MM/yy")} -
                                            {analise.data_fim ? format(new Date(analise.data_fim), "dd/MM/yy") : "..."}
                                        </TableCell>
                                        <TableCell className="text-center">{analise.qtd_sessoes}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(analise.custo_produto)}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            {formatCurrency(analise.qtd_sessoes > 0 ? analise.custo_produto / analise.qtd_sessoes : 0)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => excluirAnalise(analise.id)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
