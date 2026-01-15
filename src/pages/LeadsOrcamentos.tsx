import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, CheckCircle, XCircle, ArrowRight, Calendar, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { LeadOrcamentoForm } from "@/components/orcamentos/LeadOrcamentoForm";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface Orcamento {
    id: string;
    nome: string;
    numero: string;
    plataforma_contato: string;
    data_contato: string;
    status: string;
    local_tatuagem?: string;
    estilo?: string;
    quantidade_sessoes?: number;
    valor_total?: number;
    observacoes?: string;
    created_at: string;
}

export default function LeadsOrcamentos() {
    const navigate = useNavigate();
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [plataformaFilter, setPlataformaFilter] = useState<string>("todos");
    const [orcamentoToConvert, setOrcamentoToConvert] = useState<string | null>(null);
    const [orcamentoToLose, setOrcamentoToLose] = useState<string | null>(null);

    const fetchOrcamentos = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('orcamentos')
                .select('*')
                .order('data_contato', { ascending: false });

            if (statusFilter !== 'todos') {
                query = query.eq('status', statusFilter);
            }

            if (plataformaFilter !== 'todos') {
                query = query.eq('plataforma_contato', plataformaFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setOrcamentos(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar orçamentos:', error);
            toast({
                title: "Erro",
                description: "Erro ao carregar orçamentos",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrcamentos();
    }, [statusFilter, plataformaFilter]);

    const handleConvertOrcamento = async (id: string) => {
        try {
            const { data, error } = await supabase
                .rpc('converter_orcamento_em_cliente', { p_orcamento_id: id });

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Orçamento convertido em cliente e projeto",
            });

            // Navegar para o projeto criado
            if (data?.projeto_id) {
                navigate(`/projetos/${data.projeto_id}`);
            }

            fetchOrcamentos();
        } catch (error: any) {
            console.error('Erro ao converter orçamento:', error);
            toast({
                title: "Erro",
                description: error.message || "Erro ao converter orçamento",
                variant: "destructive"
            });
        } finally {
            setOrcamentoToConvert(null);
        }
    };

    const handleMarkAsLost = async (id: string) => {
        try {
            const { error } = await supabase
                .from('orcamentos')
                .update({ status: 'perdido' })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Orçamento marcado como perdido",
                description: "Status atualizado com sucesso",
            });

            fetchOrcamentos();
        } catch (error: any) {
            console.error('Erro ao marcar como perdido:', error);
            toast({
                title: "Erro",
                description: "Erro ao atualizar status",
                variant: "destructive"
            });
        } finally {
            setOrcamentoToLose(null);
        }
    };

    const filteredOrcamentos = orcamentos.filter(o =>
        o.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.numero?.includes(searchTerm)
    );

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            pendente: { label: "Pendente", className: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20" },
            fechado: { label: "Fechado", className: "bg-green-500/10 text-green-600 hover:bg-green-500/20" },
            perdido: { label: "Perdido", className: "bg-red-500/10 text-red-600 hover:bg-red-500/20" }
        };
        const variant = variants[status] || variants.pendente;
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    const getPlataformaBadge = (plataforma: string) => {
        const icons: Record<string, string> = {
            instagram: "📸",
            whatsapp: "💬",
            presencial: "🏪"
        };
        return <span className="capitalize">{icons[plataforma] || ""} {plataforma}</span>;
    };

    const getDiasSinceContact = (dataContato: string) => {
        return formatDistanceToNow(new Date(dataContato), { addSuffix: true, locale: ptBR });
    };

    return (
        <div className="space-y-6 p-6 pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leads e Orçamentos</h1>
                    <p className="text-muted-foreground">Gerencie todos os orçamentos e leads</p>
                </div>
                <LeadOrcamentoForm onSave={fetchOrcamentos} />
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nome ou número..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="fechado">Fechado</SelectItem>
                                    <SelectItem value="perdido">Perdido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Plataforma</label>
                            <Select value={plataformaFilter} onValueChange={setPlataformaFilter}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todas</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="presencial">Presencial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Orçamentos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Orçamentos ({filteredOrcamentos.length})</span>
                        <Badge variant="secondary">{orcamentos.filter(o => o.status === 'pendente').length} pendentes</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                    ) : filteredOrcamentos.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">Nenhum orçamento encontrado</p>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead>Plataforma</TableHead>
                                        <TableHead>Projeto</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrcamentos.map((o) => (
                                        <TableRow key={o.id}>
                                            <TableCell className="font-medium">{o.nome}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{o.numero}</TableCell>
                                            <TableCell className="text-sm">{getPlataformaBadge(o.plataforma_contato)}</TableCell>
                                            <TableCell className="text-sm">
                                                {o.estilo && <div>{o.estilo}</div>}
                                                {o.local_tatuagem && <div className="text-xs text-muted-foreground">{o.local_tatuagem}</div>}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {o.valor_total ? `R$ ${o.valor_total.toFixed(2)}` : '-'}
                                                {o.quantidade_sessoes && <div className="text-xs text-muted-foreground">{o.quantidade_sessoes}x sessões</div>}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(o.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {getDiasSinceContact(o.data_contato)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <LeadOrcamentoForm
                                                        orcamento={o}
                                                        onSave={fetchOrcamentos}
                                                        trigger={
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8"
                                                                title="Editar orçamento"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    {o.status === 'pendente' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8"
                                                                onClick={() => setOrcamentoToConvert(o.id)}
                                                                title="Fechar orçamento"
                                                            >
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8"
                                                                onClick={() => setOrcamentoToLose(o.id)}
                                                                title="Marcar como perdido"
                                                            >
                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog de Confirmação - Converter */}
            <AlertDialog open={!!orcamentoToConvert} onOpenChange={() => setOrcamentoToConvert(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fechar Orçamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso irá criar um novo cliente e projeto automaticamente. Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => orcamentoToConvert && handleConvertOrcamento(orcamentoToConvert)}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de Confirmação - Marcar como Perdido */}
            <AlertDialog open={!!orcamentoToLose} onOpenChange={() => setOrcamentoToLose(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Marcar como Perdido</AlertDialogTitle>
                        <AlertDialogDescription>
                            O orçamento será marcado como perdido. Você pode reverter isso depois se necessário.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => orcamentoToLose && handleMarkAsLost(orcamentoToLose)}>
                            Marcar como Perdido
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
