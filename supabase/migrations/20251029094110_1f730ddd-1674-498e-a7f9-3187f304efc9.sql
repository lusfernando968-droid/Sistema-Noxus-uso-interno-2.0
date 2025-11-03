-- Adicionar foreign key na tabela transacoes referenciando agendamentos
ALTER TABLE public.transacoes
ADD CONSTRAINT fk_transacoes_agendamento
FOREIGN KEY (agendamento_id) 
REFERENCES public.agendamentos(id)
ON DELETE SET NULL;