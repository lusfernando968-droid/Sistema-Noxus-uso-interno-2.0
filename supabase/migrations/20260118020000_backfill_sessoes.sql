DO $$
DECLARE
    r RECORD;
    sessao_exists UUID;
    transacao_exists UUID;
    v_numero_sessao INT;
    v_projeto_owner UUID;
    v_cliente_nome TEXT;
    v_cliente_id UUID;
BEGIN
    -- Loop through all completed appointments
    FOR r IN SELECT * FROM agendamentos WHERE status = 'concluido'
    LOOP
        ---------------------------------------------------------
        -- 1. PROJETO_SESSOES Backfill
        ---------------------------------------------------------
        IF r.projeto_id IS NOT NULL THEN
            -- Check if session already exists for this appointment
            SELECT id INTO sessao_exists FROM projeto_sessoes WHERE agendamento_id = r.id;
            
            IF sessao_exists IS NULL THEN
                -- Calculate next session number for this project
                SELECT COALESCE(MAX(numero_sessao), 0) + 1 INTO v_numero_sessao 
                FROM projeto_sessoes 
                WHERE projeto_id = r.projeto_id;
                
                -- Insert missing session
                INSERT INTO projeto_sessoes (
                    projeto_id,
                    agendamento_id,
                    numero_sessao,
                    data_sessao,
                    valor_sessao,
                    status_pagamento,
                    observacoes_tecnicas
                ) VALUES (
                    r.projeto_id,
                    r.id,
                    v_numero_sessao,
                    r.data,
                    r.valor_estimado,
                    'pendente',
                    'Gerado automaticamente por backfill'
                );
            END IF;
        END IF;

        ---------------------------------------------------------
        -- 2. TRANSACOES Backfill
        ---------------------------------------------------------
        IF r.valor_estimado > 0 THEN
            -- Check if transaction already exists
            SELECT id INTO transacao_exists FROM transacoes WHERE agendamento_id = r.id;
            
            IF transacao_exists IS NULL THEN
                -- Needed to get the user_id (owner) if r.user_id is not reliable or to ensure consistency
                -- Assuming r.user_id is correct as per schema commonality
                
                -- Fetch Client Name for description
                -- Agendamentos might not have cliente_id directly, it comes from projects
                SELECT cliente_id INTO v_cliente_id FROM projetos WHERE id = r.projeto_id;
                
                IF v_cliente_id IS NOT NULL THEN
                     SELECT nome INTO v_cliente_nome FROM clientes WHERE id = v_cliente_id;
                END IF;

                IF v_cliente_nome IS NULL THEN
                    v_cliente_nome := r.cliente_nome;
                END IF;
                IF v_cliente_nome IS NULL THEN
                    v_cliente_nome := 'Cliente';
                END IF;

                INSERT INTO transacoes (
                    user_id,
                    tipo,
                    categoria,
                    valor,
                    data_vencimento,
                    descricao,
                    agendamento_id
                ) VALUES (
                    r.user_id,
                    'RECEITA',
                    'Serviços',
                    r.valor_estimado,
                    r.data,
                    'Sessão realizada: ' || COALESCE(r.titulo, 'Serviço') || ' - ' || v_cliente_nome,
                    r.id
                );
            END IF;
        END IF;
        
    END LOOP;
END $$;
