import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, DollarSign, FolderOpen, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interfaces
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento?: string;
  endereco?: string;
  indicado_por?: string;
  created_at: string;
  updated_at: string;
}

interface ProjetoCliente {
  id: string;
  titulo: string;
  status: string;
  valor_total?: number;
  valor_pago?: number;
  categoria?: string;
  created_at: string;
}

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [projetos, setProjetos] = useState<ProjetoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjetos: 0,
    valorTotal: 0,
    valorPago: 0,
    projetosAtivos: 0
  });

  useEffect(() => {
    const carregarCliente = async () => {
      if (!id) {
        toast({
          title: "Erro",
          description: "ID do cliente não encontrado",
          variant: "destructive",
        });
        navigate('/clientes');
        return;
      }

      try {
        setLoading(true);

        // Buscar cliente
        const { data: clienteEncontrado, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single();

        if (clienteError || !clienteEncontrado) {
          toast({
            title: "Cliente não encontrado",
            description: "O cliente solicitado não existe",
            variant: "destructive",
          });
          navigate('/clientes');
          return;
        }

        // Buscar projetos do cliente
        const { data: projetosCliente, error: projetosError } = await supabase
          .from('projetos')
          .select('*')
          .eq('cliente_id', id);

        if (projetosError) throw projetosError;

        const projetosData = projetosCliente || [];

        // Calcular estatísticas
        const totalProjetos = projetosData.length;
        const valorTotal = projetosData.reduce((sum, p) => sum + (p.valor_total || 0), 0);
        const projetosAtivos = projetosData.filter(p => p.status === 'andamento').length;

        // Calcular valor pago total
        let valorPagoTotal = 0;
        for (const projeto of projetosData) {
          const { data: sessoes } = await supabase
            .from('projeto_sessoes')
            .select('valor_sessao')
            .eq('projeto_id', projeto.id)
            .eq('status_pagamento', 'pago');
          
          valorPagoTotal += (sessoes || []).reduce((sum, s) => sum + (s.valor_sessao || 0), 0);
        }

        // Formatar projetos para exibição
        const projetosFormatados: ProjetoCliente[] = projetosData.map(p => ({
          id: p.id,
          titulo: p.titulo,
          status: p.status,
          valor_total: p.valor_total,
          valor_pago: 0,
          categoria: p.categoria,
          created_at: p.created_at
        }));

        setCliente(clienteEncontrado);
        setProjetos(projetosFormatados);
        setStats({
          totalProjetos,
          valorTotal,
          valorPago: valorPagoTotal,
          projetosAtivos
        });

      } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        toast({
          title: "Erro ao carregar cliente",
          description: "Não foi possível carregar os dados do cliente",
          variant: "destructive",
        });
        navigate('/clientes');
      } finally {
        setLoading(false);
      }
    };

    carregarCliente();
  }, [id, navigate, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'andamento':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'concluido':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelado':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'Planejamento';
      case 'andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/clientes')}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{cliente.nome}</h1>
          <p className="text-muted-foreground">Detalhes do cliente</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Projetos</p>
                <p className="text-2xl font-bold">{stats.totalProjetos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">R$ {stats.valorTotal.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="text-2xl font-bold">R$ {stats.valorPago.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                <p className="text-2xl font-bold">{stats.projetosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="info" className="rounded-xl">Informações</TabsTrigger>
          <TabsTrigger value="projetos" className="rounded-xl">Projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-lg">{cliente.nome}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{cliente.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p>{cliente.telefone}</p>
                  </div>
                </div>

                {cliente.documento && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Documento</label>
                    <p>{cliente.documento}</p>
                  </div>
                )}

                {cliente.endereco && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p>{cliente.endereco}</p>
                    </div>
                  </div>
                )}

                {cliente.indicado_por && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Indicado por</label>
                    <p>{cliente.indicado_por}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Cliente desde</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projetos" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Projetos do Cliente
              </CardTitle>
              <CardDescription>
                Histórico completo de projetos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projetos.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum projeto encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projetos.map((projeto) => (
                    <div
                      key={projeto.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{projeto.titulo}</h3>
                          <Badge className={`${getStatusColor(projeto.status)} border`}>
                            {getStatusLabel(projeto.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {projeto.categoria && (
                            <span>{projeto.categoria}</span>
                          )}
                          {projeto.valor_total && (
                            <span>R$ {projeto.valor_total.toLocaleString('pt-BR')}</span>
                          )}
                          <span>{new Date(projeto.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/projetos/${projeto.id}`)}
                        className="rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}