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
import { Plus, CheckCircle, Trash2, History, Calculator, AlertCircle, CalendarDays, List } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function AnaliseCusto() {
    const { analises, loading, iniciarAnalise, finalizarAnalise, excluirAnalise, registrarUso } = useAnaliseCusto();
    const { produtos } = useProdutos();

    const { user } = useAuth();
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
    const [custoManual, setCustoManual] = useState<string>("");

    // Session Selection Dialog State
    const [isSessionSelectOpen, setIsSessionSelectOpen] = useState(false);
    const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
    const [availableSessions, setAvailableSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");

    // Linked Sessions Dialog State
    const [isLinkedSessionsOpen, setIsLinkedSessionsOpen] = useState(false);
    const [linkedSessions, setLinkedSessions] = useState<any[]>([]);
    const [viewingAnalysisId, setViewingAnalysisId] = useState<string | null>(null);

    const fetchConcludedSessions = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
                id, 
                data, 
                hora, 
                titulo,
                projetos!inner(
                    clientes!inner(
                        nome
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'concluido')
            .order('data', { ascending: false });

        if (error) {
            console.error("Erro ao buscar sessões:", error);
            return;
        }

        if (data) {
            setAvailableSessions(data);
        }
    };

    const handleOpenSessionSelect = async (analysisId: string) => {
        setSelectedAnalysisId(analysisId);
        await fetchConcludedSessions();
        setIsSessionSelectOpen(true);
    };

    const handleConfirmSessionUse = async () => {
        if (selectedAnalysisId) {
            await registrarUso([selectedAnalysisId]);
            setIsSessionSelectOpen(false);
            setSelectedSessionId("");
            setSelectedAnalysisId(null);
        }
    };

    const fetchLinkedSessions = async (analysisId: string) => {
        if (!user) return;
        // For now, we'll show a placeholder since we don't have a direct link table
        // In a real implementation, you'd query a junction table or track this in analise_custo
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
                id, 
                data, 
                hora, 
                titulo,
                projetos!inner(
                    clientes!inner(
                        nome
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'concluido')
            .order('data', { ascending: false })
            .limit(10); // Limit for now

        if (error) {
            console.error("Erro ao buscar sessões vinculadas:", error);
            return;
        }

        if (data) {
            setLinkedSessions(data);
        }
    };

    const handleViewLinkedSessions = async (analysisId: string) => {
        setViewingAnalysisId(analysisId);
        await fetchLinkedSessions(analysisId);
        setIsLinkedSessionsOpen(true);
    };

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
                                            className="flex-1"
                                            onClick={() => handleViewLinkedSessions(analise.id)}
                                        >
                                            <List className="h-4 w-4 mr-2" /> Ver Sessões
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => handleOpenSessionSelect(analise.id)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Registrar
                                        </Button>
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

            {/* Session Selection Dialog */}
            <Dialog open={isSessionSelectOpen} onOpenChange={setIsSessionSelectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Uso em Sessão</DialogTitle>
                        <CardDescription>Selecione a sessão onde este material foi utilizado.</CardDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Sessão Concluída</Label>
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma sessão..." />
                            </SelectTrigger>
                            <SelectContent position="popper" side="bottom" align="start" className="max-h-[200px]">
                                {availableSessions.map(session => (
                                    <SelectItem key={session.id} value={session.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground font-mono text-xs">
                                                {format(new Date(session.data), "dd/MM")}
                                            </span>
                                            <span className="font-medium">
                                                {session.projetos?.clientes?.nome || "Cliente não encontrado"}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                            Apenas sessões concluídas são listadas.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSessionSelectOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmSessionUse} disabled={!selectedSessionId}>Confirmar Uso</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Linked Sessions Dialog */}
            <Dialog open={isLinkedSessionsOpen} onOpenChange={setIsLinkedSessionsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Sessões Vinculadas</DialogTitle>
                        <CardDescription>
                            Histórico de sessões onde este material foi utilizado.
                        </CardDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {linkedSessions.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Nenhuma sessão vinculada</AlertTitle>
                                <AlertDescription>
                                    Este material ainda não foi registrado em nenhuma sessão.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Serviço</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {linkedSessions.map(session => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {format(new Date(session.data), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {session.projetos?.clientes?.nome || "N/A"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {session.titulo || "Sem título"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsLinkedSessionsOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
