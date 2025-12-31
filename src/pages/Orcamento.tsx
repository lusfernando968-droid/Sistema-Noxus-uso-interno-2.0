import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrcamentoForm } from "@/components/orcamentos/OrcamentoForm";
import { RegistroSessoesDialog, OrcamentoRegistro } from "@/components/orcamentos/RegistroSessoesDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

export default function Orcamento() {
    const { user, masterId } = useAuth();
    const [registros, setRegistros] = useState<OrcamentoRegistro[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchOrcamentos();
        }
    }, [user?.id]);

    const fetchOrcamentos = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orcamentos')
                .select(`
                    *,
                    clientes ( nome )
                `)
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const registrosFormatados: OrcamentoRegistro[] = data.map((item: any) => ({
                    id: item.id,
                    cliente: item.clientes?.nome || "Cliente Desconhecido",
                    clienteId: item.cliente_id, // Ensure we retrieve client_id for processing
                    dataCriacao: new Date(item.created_at),
                    tamanho: item.tamanho,
                    estilo: item.estilo,
                    cor: item.cor,
                    locais: item.locais as string[],
                    tempoEstimado: item.tempo_estimado,
                    valorEstimado: item.valor_estimado
                }));
                setRegistros(registrosFormatados);
            }
        } catch (error) {
            console.error("Erro ao carregar orçamentos:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar o histórico.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveOrcamento = async (dados: {
        clienteId: string;
        tamanho: number;
        estilo: string;
        cor: string;
        locais: string[];
        tempoEstimado: number;
        valorEstimado: number;
    }) => {
        try {
            const { error } = await supabase
                .from('orcamentos')
                .insert([{
                    user_id: user!.id,
                    cliente_id: dados.clienteId,
                    tamanho: dados.tamanho,
                    estilo: dados.estilo,
                    cor: dados.cor,
                    locais: dados.locais,
                    tempo_estimado: dados.tempoEstimado,
                    valor_estimado: dados.valorEstimado
                }]);

            if (error) throw error;

            await fetchOrcamentos();
        } catch (error: any) {
            console.error("Erro ao salvar orçamento:", error);
            toast({
                title: "Erro",
                description: `Erro ao salvar: ${error.message || error.details || "Erro desconhecido"}`,
                variant: "destructive"
            });
        }
    };

    const handleEfetivarOrcamento = async (registro: OrcamentoRegistro) => {
        if (!registro.clienteId) {
            toast({ title: "Erro", description: "Cliente não identificado.", variant: "destructive" });
            return;
        }

        try {
            // 1. Criar Projeto
            // Se tiver masterId (Assistente), usa o ID do mestre. Se não, usa o próprio (Admin/User).
            const projectOwnerId = masterId || user!.id;

            console.log("Criando projeto para owner:", projectOwnerId);

            const { error: projetoError } = await supabase
                .from('projetos')
                .insert([{
                    user_id: projectOwnerId,
                    cliente_id: registro.clienteId,
                    titulo: `Projeto ${registro.estilo} - ${registro.tamanho}cm`,
                    descricao: `Gerado a partir do orçamento em ${registro.dataCriacao.toLocaleDateString()}. Locais: ${registro.locais.join(', ')}.`,
                    status: 'em_andamento',
                    valor_total: registro.valorEstimado,
                    categoria: 'tattoo'
                }]);

            if (projetoError) throw projetoError;

            // 2. Atualizar Status do Cliente para 'cliente' (se for lead)
            // Não precisamos checar se é lead, apenas setar para 'cliente' se ele já não for 'efetivado' (opcional, mas 'cliente' é seguro)
            const { error: clienteError } = await supabase
                .from('clientes')
                .update({ status: 'cliente' })
                .eq('id', registro.clienteId)
                .eq('status', 'lead'); // Só atualiza se for lead, para não rebaixar um 'efetivado'

            if (clienteError) console.warn("Erro ao atualizar status do cliente:", clienteError);

            toast({
                title: "Sucesso!",
                description: "Projeto criado e cliente atualizado.",
            });

            // Opcional: Navegar para projetos ou atualizar lista
        } catch (error: any) {
            console.error("Erro ao efetivar:", error);
            toast({
                title: "Erro",
                description: "Falha ao criar projeto.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteRegistro = async (id: string) => {
        try {
            const { error } = await supabase
                .from('orcamentos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setRegistros(registros.filter(r => r.id !== id));
            toast({
                title: "Registro excluído",
                description: "O orçamento foi removido do histórico.",
            });
        } catch (error) {
            console.error("Erro ao excluir:", error);
            toast({
                title: "Erro",
                description: "Não foi possível excluir o registro.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
                    <p className="text-muted-foreground">
                        Gerencie os orçamentos solicitados pelos clientes e leads.
                    </p>
                </div>
                <div className="flex gap-2">
                    <RegistroSessoesDialog
                        registros={registros}
                        onDelete={handleDeleteRegistro}
                        onEfetivar={handleEfetivarOrcamento}
                    />
                    <OrcamentoForm onSave={handleSaveOrcamento} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {registros.length > 0 ? (
                    registros.map(reg => (
                        <Card key={reg.id} className="rounded-2xl border-border hover:border-primary/50 transition-colors cursor-pointer group">
                            <CardHeader>
                                <CardTitle className="group-hover:text-primary transition-colors flex justify-between items-start">
                                    <span className="truncate pr-2">{reg.cliente}</span>
                                    <span className="text-sm font-normal text-muted-foreground whitespace-nowrap">
                                        {reg.tempoEstimado}h
                                    </span>
                                </CardTitle>
                                <CardDescription className="flex flex-col gap-1">
                                    <span className="font-medium text-foreground/80">{reg.estilo} - {reg.tamanho}cm</span>
                                    <span className="text-xs">{reg.locais.join(", ") || "Sem local"}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-green-600">
                                    {reg.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {reg.dataCriacao.toLocaleDateString()} às {format(reg.dataCriacao, "HH:mm")}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="rounded-2xl border-border hover:border-primary/50 transition-colors cursor-pointer group opacity-50 border-dashed">
                        <CardHeader>
                            <CardTitle className="group-hover:text-primary transition-colors">Sem registros</CardTitle>
                            <CardDescription>Crie um novo orçamento para começar</CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </div>
    );
}

// Import helper format if needed or assume date-fns format used previously
import { format } from "date-fns";
