import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  FileText,
  Save,
  X
} from "lucide-react";

interface ProjetoSessao {
  id: string;
  projeto_id: string;
  numero_sessao: number;
  data_sessao: string;
  valor_sessao?: number;
  status_pagamento: 'pendente' | 'pago' | 'cancelado';
  metodo_pagamento?: string;
  feedback_cliente?: string;
  observacoes_tecnicas?: string;
  avaliacao?: number;
  created_at: string;
  updated_at: string;
}

interface FeedbackFormData {
  sessao_id: string;
  feedback_cliente: string;
  observacoes_tecnicas: string;
  avaliacao: number;
}

interface FeedbackManagerProps {
  projetoId: string;
  onFeedbackUpdate?: () => void;
}

export function FeedbackManager({ projetoId, onFeedbackUpdate }: FeedbackManagerProps) {
  const { toast } = useToast();
  const [sessoes, setSessoes] = useState<ProjetoSessao[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<ProjetoSessao | null>(null);
  const [formData, setFormData] = useState<FeedbackFormData>({
    sessao_id: '',
    feedback_cliente: '',
    observacoes_tecnicas: '',
    avaliacao: 5
  });

  useEffect(() => {
    loadSessoes();
  }, [projetoId]);

  const loadSessoes = async () => {
    try {
      setLoading(true);
      const { data: sessoesData, error } = await supabase
        .from('projeto_sessoes')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('numero_sessao', { ascending: true });
      
      if (error) throw error;
      setSessoes(sessoesData || []);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sessões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeedback = () => {
    setEditingFeedback(null);
    setFormData({
      sessao_id: '',
      feedback_cliente: '',
      observacoes_tecnicas: '',
      avaliacao: 5
    });
    setDialogOpen(true);
  };

  const handleEditFeedback = (sessao: ProjetoSessao) => {
    setEditingFeedback(sessao);
    setFormData({
      sessao_id: sessao.id,
      feedback_cliente: sessao.feedback_cliente || '',
      observacoes_tecnicas: sessao.observacoes_tecnicas || '',
      avaliacao: sessao.avaliacao || 5
    });
    setDialogOpen(true);
  };

  const handleSaveFeedback = async () => {
    if (!formData.sessao_id) {
      toast({
        title: "Erro",
        description: "Selecione uma sessão",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('projeto_sessoes')
        .update({
          feedback_cliente: formData.feedback_cliente.trim() || null,
          observacoes_tecnicas: formData.observacoes_tecnicas.trim() || null,
          avaliacao: formData.avaliacao
        })
        .eq('id', formData.sessao_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: editingFeedback ? "Feedback atualizado com sucesso!" : "Feedback criado com sucesso!",
      });

      setDialogOpen(false);
      await loadSessoes();
      onFeedbackUpdate?.();

    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (sessaoId: string) => {
    if (!confirm('Tem certeza que deseja remover este feedback?')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('projeto_sessoes')
        .update({
          feedback_cliente: null,
          observacoes_tecnicas: null,
          avaliacao: null
        })
        .eq('id', sessaoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Feedback removido com sucesso!",
      });

      await loadSessoes();
      onFeedbackUpdate?.();

    } catch (error) {
      console.error('Erro ao remover feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSessoesDisponiveis = () => {
    if (editingFeedback) {
      return sessoes;
    }
    return sessoes;
  };

  const getSessaoStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelado':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && sessoes.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sessões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Feedbacks</h3>
          <p className="text-sm text-muted-foreground">
            Adicione, edite ou remova feedbacks das sessões
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateFeedback} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Novo Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFeedback ? 'Editar Feedback' : 'Novo Feedback'}
              </DialogTitle>
              <DialogDescription>
                {editingFeedback 
                  ? 'Edite o feedback e avaliação da sessão'
                  : 'Adicione feedback e avaliação para uma sessão'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Seleção de Sessão */}
              <div className="space-y-2">
                <Label htmlFor="sessao">Sessão</Label>
                <Select
                  value={formData.sessao_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sessao_id: value }))}
                  disabled={!!editingFeedback}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSessoesDisponiveis().map((sessao) => (
                      <SelectItem key={sessao.id} value={sessao.id}>
                        <div className="flex items-center gap-2">
                          <span>Sessão {sessao.numero_sessao}</span>
                          <span className="text-muted-foreground">
                            - {new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}
                          </span>
                          <Badge className={`${getSessaoStatusColor(sessao.status_pagamento)} border text-xs`}>
                            {sessao.status_pagamento}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Avaliação */}
              <div className="space-y-2">
                <Label htmlFor="avaliacao">Avaliação</Label>
                <Select
                  value={formData.avaliacao.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, avaliacao: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        <div className="flex items-center gap-2">
                          {renderStars(rating)}
                          <span>{rating} estrela{rating !== 1 ? 's' : ''}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback do Cliente */}
              <div className="space-y-2">
                <Label htmlFor="feedback_cliente">Feedback do Cliente</Label>
                <Textarea
                  id="feedback_cliente"
                  placeholder="Digite o feedback do cliente..."
                  value={formData.feedback_cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedback_cliente: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Observações Técnicas */}
              <div className="space-y-2">
                <Label htmlFor="observacoes_tecnicas">Observações Técnicas</Label>
                <Textarea
                  id="observacoes_tecnicas"
                  placeholder="Digite as observações técnicas..."
                  value={formData.observacoes_tecnicas}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes_tecnicas: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveFeedback}
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingFeedback ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Sessões */}
      <div className="space-y-4">
        {sessoes.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma sessão encontrada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Crie sessões para o projeto para poder adicionar feedbacks
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessoes.map((sessao) => (
            <Card key={sessao.id} className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">Sessão {sessao.numero_sessao}</h4>
                      <Badge className={`${getSessaoStatusColor(sessao.status_pagamento)} border`}>
                        {sessao.status_pagamento}
                      </Badge>
                      {sessao.avaliacao && (
                        <div className="flex items-center gap-1">
                          {renderStars(sessao.avaliacao)}
                          <span className="text-sm text-muted-foreground ml-1">
                            ({sessao.avaliacao}/5)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}
                      </div>
                      {sessao.valor_sessao && (
                        <span>R$ {sessao.valor_sessao.toLocaleString('pt-BR')}</span>
                      )}
                    </div>

                    {/* Feedback do Cliente */}
                    {sessao.feedback_cliente && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900 text-sm">Feedback do Cliente</span>
                        </div>
                        <p className="text-blue-800 text-sm">{sessao.feedback_cliente}</p>
                      </div>
                    )}

                    {/* Observações Técnicas */}
                    {sessao.observacoes_tecnicas && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 text-sm">Observações Técnicas</span>
                        </div>
                        <p className="text-gray-800 text-sm">{sessao.observacoes_tecnicas}</p>
                      </div>
                    )}

                    {/* Estado sem feedback */}
                    {!sessao.feedback_cliente && !sessao.observacoes_tecnicas && !sessao.avaliacao && (
                      <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum feedback registrado</p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditFeedback(sessao)}
                      className="rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {(sessao.feedback_cliente || sessao.observacoes_tecnicas || sessao.avaliacao) && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteFeedback(sessao.id)}
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}