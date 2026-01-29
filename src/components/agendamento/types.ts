// Interfaces e tipos do módulo de Agendamentos

export type AgendamentoStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';

export interface Agendamento {
  id: string;
  cliente_nome: string;
  cliente_id: string;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
  servico: string;
  status: AgendamentoStatus;
  observacoes: string;
  valor_estimado: number;
  valor_sinal?: number;
  data_pagamento_sinal?: string;
  tatuador: string;
  local: string;
}

export interface AgendamentoFormData {
  cliente_nome: string;
  cliente_id: string;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
  servico: string;
  status: AgendamentoStatus;
  observacoes: string;
  valor_estimado: number;
  valor_sinal?: number;
  data_pagamento_sinal?: string;
  tatuador: string;
  local: string;
}

export interface Cliente {
  id: string;
  nome: string;
}

export interface Projeto {
  id: string;
  titulo: string;
  valor_por_sessao?: number;
  cliente_id: string;
}

export const INITIAL_FORM_DATA: AgendamentoFormData = {
  cliente_nome: "",
  cliente_id: "",
  data_agendamento: "",
  hora_inicio: "",
  hora_fim: "",
  servico: "",
  status: "agendado",
  observacoes: "",
  valor_estimado: 0,
  valor_sinal: 0,
  data_pagamento_sinal: "",
  tatuador: "",
  local: "Estúdio Principal"
};

export const DEFAULT_SESSION_MINUTES = 120; // 2h padrão

