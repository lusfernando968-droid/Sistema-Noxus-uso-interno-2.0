import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAnaliseCusto } from "@/hooks/useAnaliseCusto";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Agendamento, Cliente, Projeto } from "./types";
import { isUUID } from "./utils";

interface UseAgendamentosFeedbackProps {
  agendamentos: Agendamento[];
  setAgendamentos: React.Dispatch<React.SetStateAction<Agendamento[]>>;
  clientes: Cliente[];
  projetos: Projeto[];
}

export function useAgendamentosFeedback({
  agendamentos,
  setAgendamentos,
  clientes,
  projetos,
}: UseAgendamentosFeedbackProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { analises } = useAnaliseCusto();

  // Estados de feedback
  const [isFeedbackPromptOpen, setIsFeedbackPromptOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [agendamentoParaConfirmar, setAgendamentoParaConfirmar] = useState<Agendamento | null>(null);
  const [feedbackCliente, setFeedbackCliente] = useState('');
  const [avaliacao, setAvaliacao] = useState<number>(5);
  const [observacoesTecnicas, setObservacoesTecnicas] = useState<string>('');
  const [agendamentoParaAnalise, setAgendamentoParaAnalise] = useState<Agendamento | null>(null);
  const [isAnaliseDialogOpen, setIsAnaliseDialogOpen] = useState(false);

  // Buscar owner do agendamento
  const fetchAgendamentoOwner = async (id: string) => {
    try {
      if (!user || !isUUID(id)) return null;
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, user_id, status')
        .eq('id', id)
        .maybeSingle();
      if (error) return null;
      return data as any;
    } catch {
      return null;
    }
  };

  // Confirmar sessão realizada
  const handleConfirmSessao = async (
    agendamento: Agendamento,
    feedback?: string,
    observacoes?: string,
    avaliacaoValor?: number
  ) => {
    try {
      setAgendamentos(prev => prev.map(a => a.id === agendamento.id ? { ...a, status: 'concluido' } : a));

      if (!user) {
        toast({ title: 'Sessão confirmada localmente', description: 'Faça login para registrar nas tabelas.' });
        return;
      }

      const projeto = projetos.find(p => p.titulo === agendamento.tatuador);

      if (projeto?.id) {
        const agendamentoUUID = isUUID(agendamento.id) ? agendamento.id : null;
        let existingSessaoId: string | null = null;

        if (agendamentoUUID) {
          const { data: sessaoDoAgendamento, error: sessaoLookupError } = await supabase
            .from('projeto_sessoes')
            .select('id')
            .eq('projeto_id', projeto.id)
            .eq('agendamento_id', agendamentoUUID)
            .limit(1)
            .maybeSingle();

          if (sessaoLookupError && sessaoLookupError.code !== 'PGRST116') throw sessaoLookupError;
          existingSessaoId = sessaoDoAgendamento?.id || null;
        }

        if (existingSessaoId) {
          const { error: updateError } = await supabase
            .from('projeto_sessoes')
            .update({
              feedback_cliente: feedback || null,
              observacoes_tecnicas: observacoes ?? null,
              valor_sessao: agendamento.valor_estimado || null,
              data_sessao: agendamento.data_agendamento,
              avaliacao: avaliacaoValor ?? null,
            })
            .eq('id', existingSessaoId);

          if (updateError) throw updateError;
        } else {
          const { data: sessoesExistentes, error: countError } = await supabase
            .from('projeto_sessoes')
            .select('id')
            .eq('projeto_id', projeto.id);

          if (countError) throw countError;

          const numeroSessao = (sessoesExistentes?.length || 0) + 1;

          const { error: sessaoError } = await supabase
            .from('projeto_sessoes')
            .insert({
              projeto_id: projeto.id,
              agendamento_id: agendamentoUUID,
              numero_sessao: numeroSessao,
              data_sessao: agendamento.data_agendamento,
              valor_sessao: agendamento.valor_estimado || null,
              status_pagamento: 'pendente',
              metodo_pagamento: null,
              observacoes_tecnicas: observacoes ?? null,
              feedback_cliente: feedback || null,
              avaliacao: avaliacaoValor ?? null,
            });

          if (sessaoError) throw sessaoError;
        }
      }

      let clienteNome = agendamento.cliente_nome || clientes.find(c => c.id === agendamento.cliente_id)?.nome;

      if (!clienteNome && isUUID(agendamento.id)) {
        const { data: agData } = await supabase
          .from('agendamentos')
          .select('projeto_id')
          .eq('id', agendamento.id)
          .maybeSingle();

        if (agData?.projeto_id) {
          const { data: projData } = await supabase
            .from('projetos')
            .select('cliente_id')
            .eq('id', agData.projeto_id)
            .maybeSingle();

          if (projData?.cliente_id) {
            const { data: cliData } = await supabase
              .from('clientes')
              .select('nome')
              .eq('id', projData.cliente_id)
              .maybeSingle();

            if (cliData?.nome) {
              clienteNome = cliData.nome;
            }
          }
        }
      }

      clienteNome = clienteNome || "Cliente";

      if (agendamento.valor_estimado && agendamento.valor_estimado > 0) {
        const agendamentoUUID = isUUID(agendamento.id) ? agendamento.id : null;

        if (agendamentoUUID) {
          const { data: existingTransacao, error: lookupError } = await supabase
            .from('transacoes')
            .select('id')
            .eq('agendamento_id', agendamentoUUID)
            .limit(1)
            .maybeSingle();

          if (lookupError && lookupError.code !== 'PGRST116') throw lookupError;

          if (existingTransacao?.id) {
            const { error: updateErro } = await supabase
              .from('transacoes')
              .update({
                descricao: `Sessão realizada: ${agendamento.servico} - ${clienteNome}`,
              })
              .eq('id', existingTransacao.id);
            if (updateErro) throw updateErro;
          } else {
            const { error: transacaoError } = await supabase
              .from('transacoes')
              .insert({
                user_id: user.id,
                tipo: 'RECEITA',
                categoria: 'Serviços',
                valor: agendamento.valor_estimado,
                data_vencimento: agendamento.data_agendamento,
                descricao: `Sessão realizada: ${agendamento.servico} - ${clienteNome}`,
                agendamento_id: agendamentoUUID,
              });
            if (transacaoError) throw transacaoError;
          }
        }
      }

      if (isUUID(agendamento.id)) {
        const owner = await fetchAgendamentoOwner(agendamento.id);
        if (!owner || String(owner.user_id) !== String(user.id)) {
          toast({ title: 'Sem permissão para atualizar', description: 'Este agendamento não pertence ao seu usuário.', variant: 'destructive' });
        } else {
          const { data: updated, error: statusErr } = await supabase
            .from('agendamentos')
            .update({ status: 'concluido' })
            .eq('id', agendamento.id)
            .select('id, status')
            .maybeSingle();
          if (statusErr) throw statusErr;
          if (!updated) {
            toast({ title: 'Atualização não aplicada', description: 'Nenhuma linha foi atualizada.', variant: 'destructive' });
          }
        }
      }

      toast({ title: 'Sessão confirmada!', description: 'Registro salvo nas tabelas relacionadas.' });
    } catch (err) {
      console.error('Erro ao confirmar sessão:', err);
      toast({ title: 'Erro ao confirmar sessão', description: 'Tente novamente mais tarde.' });
    }
  };

  // Fluxo de feedback
  const openFeedbackPrompt = (ag: Agendamento) => {
    setAgendamentoParaConfirmar(ag);
    setIsFeedbackPromptOpen(true);
  };

  const confirmWithoutFeedback = async () => {
    if (!agendamentoParaConfirmar) return;
    setIsFeedbackPromptOpen(false);
    await handleConfirmSessao(agendamentoParaConfirmar);
    setAgendamentoParaConfirmar(null);
    setFeedbackCliente('');
  };

  const confirmWithFeedback = () => {
    setIsFeedbackPromptOpen(false);
    setIsFeedbackDialogOpen(true);
  };

  const handleFinalConfirm = async () => {
    if (!agendamentoParaConfirmar) return;

    const texto = feedbackCliente.trim();
    await handleConfirmSessao(
      agendamentoParaConfirmar,
      texto || undefined,
      observacoesTecnicas.trim() || undefined,
      avaliacao || undefined
    );
    setIsFeedbackDialogOpen(false);
    setIsAnaliseDialogOpen(false);
    setAgendamentoParaConfirmar(null);
    setFeedbackCliente('');
    setObservacoesTecnicas('');
    setAvaliacao(5);
  };

  const submitFeedbackAndConfirm = async () => {
    if (!agendamentoParaConfirmar) return;
    if (!user) {
      toast({
        title: 'Faça login para salvar o feedback',
        description: 'Sem login, os textos não serão persistidos no banco.',
      });
      return;
    }

    const hasActiveAnalysis = analises.some(a => a.status === 'ativo');
    if (hasActiveAnalysis) {
      setAgendamentoParaAnalise(agendamentoParaConfirmar);
      setIsAnaliseDialogOpen(true);
      return;
    }

    await handleFinalConfirm();
  };

  const handleAnaliseDialogConfirm = async () => {
    if (agendamentoParaConfirmar) {
      await handleFinalConfirm();
    } else {
      setIsAnaliseDialogOpen(false);
      setAgendamentoParaAnalise(null);
    }
  };

  const cancelFeedbackDialog = () => {
    setIsFeedbackDialogOpen(false);
    setFeedbackCliente('');
    setObservacoesTecnicas('');
    setAvaliacao(5);
  };

  const openVincularAnalise = (agendamento: Agendamento) => {
    setAgendamentoParaAnalise(agendamento);
    setIsAnaliseDialogOpen(true);
  };

  return {
    // Estados
    isFeedbackPromptOpen,
    setIsFeedbackPromptOpen,
    isFeedbackDialogOpen,
    setIsFeedbackDialogOpen,
    feedbackCliente,
    setFeedbackCliente,
    avaliacao,
    setAvaliacao,
    observacoesTecnicas,
    setObservacoesTecnicas,
    agendamentoParaAnalise,
    setAgendamentoParaAnalise,
    isAnaliseDialogOpen,
    setIsAnaliseDialogOpen,

    // Handlers
    handleConfirmSessao,
    openFeedbackPrompt,
    confirmWithoutFeedback,
    confirmWithFeedback,
    submitFeedbackAndConfirm,
    cancelFeedbackDialog,
    handleAnaliseDialogConfirm,
    openVincularAnalise,
  };
}

