import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Agendamento, Cliente, Projeto, DEFAULT_SESSION_MINUTES } from "./types";
import { addMinutes } from "./utils";

export function useAgendamentosData() {
  const { checkAgendamentosMilestone } = useAchievementNotifications();
  const { user, masterId } = useAuth();

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  // Restaurar scroll
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const y = sessionStorage.getItem('agendamentos-scroll-y');
    if (y) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(y, 10));
      });
    }
  }, []);

  // Buscar lista de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        if (!masterId) return;
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nome")
          .eq("user_id", masterId)
          .order("nome");
        if (error) throw error;
        setClientes(data || []);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      }
    };
    if (masterId) fetchClientes();
  }, [masterId]);

  // Buscar lista de projetos
  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        if (!masterId) return;
        const { data, error } = await supabase
          .from("projetos")
          .select("id, titulo, valor_por_sessao, cliente_id")
          .eq("user_id", masterId)
          .order("titulo");
        if (error) throw error;
        setProjetos(data || []);
      } catch (err) {
        console.error("Erro ao buscar projetos:", err);
      }
    };
    if (masterId) fetchProjetos();
  }, [masterId]);

  // Dados demo (sem login)
  useEffect(() => {
    if (user) return;
    const agendamentosIniciais: Agendamento[] = [
      {
        id: "1",
        cliente_nome: "Ana Silva",
        cliente_id: "1",
        data_agendamento: "2024-01-15",
        hora_inicio: "14:00",
        hora_fim: "17:00",
        servico: "Tatuagem Braço",
        status: "confirmado",
        observacoes: "Primeira sessão - desenho floral",
        valor_estimado: 450.00,
        tatuador: "João Silva",
        local: "Estúdio Principal"
      },
      {
        id: "2",
        cliente_nome: "Carlos Santos",
        cliente_id: "2",
        data_agendamento: "2024-01-16",
        hora_inicio: "10:00",
        hora_fim: "12:00",
        servico: "Retoque",
        status: "agendado",
        observacoes: "Retoque na tatuagem das costas",
        valor_estimado: 150.00,
        tatuador: "Maria Santos",
        local: "Estúdio Secundário"
      }
    ];
    setAgendamentos(agendamentosIniciais);
    checkAgendamentosMilestone(agendamentosIniciais.length);
  }, [user, checkAgendamentosMilestone]);

  // Carregar agendamentos do banco
  useEffect(() => {
    const fetchDbAgendamentos = async () => {
      try {
        if (!user || !masterId) {
          if (!user) setLoading(false);
          return;
        }
        if (projetos.length === 0 || clientes.length === 0) return;

        const { data, error } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('user_id', masterId) // Use masterId
          .order('created_at', { ascending: false });
        if (error) throw error;

        const mapped = (data || []).map((row: any) => {
          const proj = projetos.find(p => p.id === row.projeto_id);
          const clienteId = proj?.cliente_id || '';
          const clienteNome = clientes.find(c => c.id === clienteId)?.nome || '';
          const horaInicio = typeof row.hora === 'string' ? row.hora.slice(0, 5) : '';
          return {
            id: row.id,
            cliente_nome: clienteNome,
            cliente_id: clienteId,
            data_agendamento: row.data,
            hora_inicio: horaInicio,
            hora_fim: horaInicio ? addMinutes(horaInicio, DEFAULT_SESSION_MINUTES) : '',
            servico: row.titulo,
            status: row.status || 'agendado',
            observacoes: row.descricao || '',
            valor_estimado: Number(row.valor_estimado || 0),
            valor_sinal: Number(row.valor_sinal || 0),
            data_pagamento_sinal: row.data_pagamento_sinal,
            tatuador: proj?.titulo || '',
            local: ''
          } as Agendamento;
        });

        setAgendamentos(mapped);
      } catch (err) {
        console.error('Erro ao carregar agendamentos do banco:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDbAgendamentos();
  }, [user, masterId, projetos, clientes]);

  return {
    agendamentos,
    setAgendamentos,
    clientes,
    projetos,
    loading,
    user,
    checkAgendamentosMilestone,
  };
}

