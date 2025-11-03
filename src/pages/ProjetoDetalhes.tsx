import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, DollarSign, User, Clock, FileText, Image, CheckCircle, MessageSquare, Star } from "lucide-react";
import { useToastWithSound } from "@/hooks/useToastWithSound";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackManager } from "@/components/projetos/FeedbackManager";

// Interfaces
interface Projeto {
  id: string;
  titulo: string;
  descricao: string;
  cliente_nome: string;
  cliente_id: string;
  status: 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';
  data_inicio: string;
  data_fim?: string;
  valor_total: number;
  valor_pago: number;
  categoria: string;
  prioridade: 'baixa' | 'media' | 'alta';
  observacoes: string;
}

interface Sessao {
  id: string;
  data: string;
  duracao: number;
  descricao: string;
  valor: number;
  status: 'agendada' | 'concluida' | 'cancelada';
  feedback_cliente?: string;
  observacoes_tecnicas?: string;
  avaliacao?: number;
}

export default function ProjetoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToastWithSound();
  const { playSound } = useSoundEffects();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessoes = async () => {
    if (!id) return;
    
    try {
      const { data: sessoesData, error } = await supabase
        .from('projeto_sessoes')
        .select('*')
        .eq('projeto_id', id)
        .order('numero_sessao', { ascending: true });
      
      if (error) throw error;

      const sessoesFormatadas: Sessao[] = (sessoesData || []).map(sessao => ({
        id: sessao.id,
        data: sessao.data_sessao,
        duracao: 120,
        descricao: sessao.observacoes_tecnicas || `Sessão ${sessao.numero_sessao}`,
        valor: sessao.valor_sessao || 0,
        status: sessao.status_pagamento === 'pago' ? 'concluida' : 'agendada',
        feedback_cliente: sessao.feedback_cliente,
        observacoes_tecnicas: sessao.observacoes_tecnicas,
        avaliacao: sessao.avaliacao
      }));
      setSessoes(sessoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  useEffect(() => {
    const carregarProjeto = async () => {
      if (!id) {
        toast({
          title: "Erro",
          description: "ID do projeto não encontrado",
          variant: "destructive",
        });
        navigate('/projetos');
        return;
      }

      try {
        setLoading(true);

        // Buscar projeto
        const { data: projetoEncontrado, error: projetoError } = await supabase
          .from('projetos')
          .select('*')
          .eq('id', id)
          .single();

        if (projetoError || !projetoEncontrado) {
          toast({
            title: "Projeto não encontrado",
            description: "O projeto solicitado não existe",
            variant: "destructive",
          });
          navigate('/projetos');
          return;
        }

        // Buscar cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', projetoEncontrado.cliente_id)
          .single();

        // Calcular valor pago
        const { data: sessoes } = await supabase
          .from('projeto_sessoes')
          .select('valor_sessao')
          .eq('projeto_id', id)
          .eq('status_pagamento', 'pago');
        
        const valorPago = (sessoes || []).reduce((sum, s) => sum + (s.valor_sessao || 0), 0);

        // Montar dados do projeto
        const projetoCompleto: Projeto = {
          id: projetoEncontrado.id,
          titulo: projetoEncontrado.titulo,
          descricao: projetoEncontrado.descricao || '',
          cliente_nome: cliente?.nome || 'Cliente não encontrado',
          cliente_id: projetoEncontrado.cliente_id,
          status: projetoEncontrado.status as any,
          data_inicio: projetoEncontrado.data_inicio || '',
          data_fim: projetoEncontrado.data_fim || undefined,
          valor_total: projetoEncontrado.valor_total || 0,
          valor_pago: valorPago,
          categoria: projetoEncontrado.categoria || '',
          prioridade: 'media',
          observacoes: projetoEncontrado.notas || ''
        };

        setProjeto(projetoCompleto);
        
        // Carregar sessões
        await loadSessoes();

      } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        toast({
          title: "Erro ao carregar projeto",
          description: "Não foi possível carregar os dados do projeto",
          variant: "destructive",
        });
        navigate('/projetos');
      } finally {
        setLoading(false);
      }
    };

    carregarProjeto();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejamento': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'em_andamento': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pausado': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'concluido': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejamento': return 'Planejamento';
      case 'em_andamento': return 'Em Andamento';
      case 'pausado': return 'Pausado';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'alta': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getSessaoStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'concluida': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelada': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Projeto não encontrado</p>
          <Button onClick={() => navigate('/projetos')} className="mt-4 rounded-xl">
            Voltar aos Projetos
          </Button>
        </div>
      </div>
    );
  }

  const progressoPagamento = (projeto.valor_pago / projeto.valor_total) * 100;
  const sessoesCompletas = sessoes.filter(s => s.status === 'concluida').length;
  const totalSessoes = sessoes.length;
  const progressoSessoes = totalSessoes > 0 ? (sessoesCompletas / totalSessoes) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              playSound('click');
              navigate('/projetos');
            }}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{projeto.titulo}</h1>
            <p className="text-muted-foreground">Cliente: {projeto.cliente_nome}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={`rounded-xl ${getStatusColor(projeto.status)}`}>
              {getStatusLabel(projeto.status)}
            </Badge>
            <Badge variant="outline" className={`rounded-xl ${getPrioridadeColor(projeto.prioridade)}`}>
              Prioridade {projeto.prioridade}
            </Badge>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">R$ {projeto.valor_total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-2xl font-bold text-blue-500">R$ {projeto.valor_pago.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Sessões</p>
                  <p className="text-2xl font-bold text-purple-500">{sessoesCompletas}/{totalSessoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="text-2xl font-bold text-orange-500">{Math.round(progressoSessoes)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl">
            <TabsTrigger value="detalhes" className="rounded-xl">Detalhes</TabsTrigger>
            <TabsTrigger value="sessoes" className="rounded-xl">Sessões</TabsTrigger>
            <TabsTrigger value="feedbacks" className="rounded-xl">Feedbacks</TabsTrigger>
            <TabsTrigger value="financeiro" className="rounded-xl">Financeiro</TabsTrigger>
            <TabsTrigger value="galeria" className="rounded-xl">Galeria</TabsTrigger>
          </TabsList>

          {/* Aba Detalhes */}
          <TabsContent value="detalhes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Informações do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                    <p className="mt-1">{projeto.descricao}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                    <p className="mt-1">{projeto.categoria}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Início</Label>
                    <p className="mt-1">{new Date(projeto.data_inicio).toLocaleDateString()}</p>
                  </div>
                  {projeto.data_fim && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Conclusão</Label>
                      <p className="mt-1">{new Date(projeto.data_fim).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                    <p className="mt-1">{projeto.cliente_nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                    <p className="mt-1">{projeto.observacoes}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      playSound('click');
                      navigate(`/clientes/${projeto.cliente_id}`);
                    }}
                    className="w-full rounded-xl"
                  >
                    Ver Perfil do Cliente
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Sessões */}
          <TabsContent value="sessoes" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Histórico de Sessões</CardTitle>
                <CardDescription>
                  {sessoesCompletas} de {totalSessoes} sessões concluídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessoes.map((sessao, index) => (
                    <div key={sessao.id} className="flex items-center gap-4 p-4 border rounded-xl">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{sessao.descricao}</p>
                          <Badge variant="outline" className={`rounded-xl ${getSessaoStatusColor(sessao.status)}`}>
                            {sessao.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sessao.data).toLocaleDateString()} • {sessao.duracao} min • R$ {sessao.valor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Feedbacks */}
          <TabsContent value="feedbacks" className="space-y-6">
            <FeedbackManager 
              projetoId={projeto.id} 
              onFeedbackUpdate={() => {
                // Recarregar dados quando feedback for atualizado
                setSessoes([]);
                loadSessoes();
              }}
            />
          </TabsContent>

          {/* Aba Financeiro */}
          <TabsContent value="financeiro" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-xl">
                    <p className="text-2xl font-bold text-green-500">R$ {projeto.valor_total.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                  </div>
                  <div className="text-center p-4 border rounded-xl">
                    <p className="text-2xl font-bold text-blue-500">R$ {projeto.valor_pago.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Valor Pago</p>
                  </div>
                  <div className="text-center p-4 border rounded-xl">
                    <p className="text-2xl font-bold text-orange-500">R$ {(projeto.valor_total - projeto.valor_pago).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Saldo Restante</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso do Pagamento</span>
                    <span>{Math.round(progressoPagamento)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressoPagamento}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Galeria */}
          <TabsContent value="galeria" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Galeria do Projeto
                </CardTitle>
                <CardDescription>
                  Fotos do progresso e resultado final
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma imagem adicionada ainda</p>
                  <Button variant="outline" className="mt-4 rounded-xl">
                    Adicionar Fotos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ações */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  playSound('click');
                  navigate(`/agendamentos?projeto=${projeto.id}`);
                }}
                className="rounded-xl"
              >
                Agendar Sessão
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  playSound('click');
                  navigate(`/clientes/${projeto.cliente_id}`);
                }}
                className="rounded-xl"
              >
                Ver Cliente
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  playSound('click');
                  navigate(`/projetos`);
                }}
                className="rounded-xl"
              >
                Voltar aos Projetos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium text-muted-foreground ${className || ''}`}>{children}</label>;
}