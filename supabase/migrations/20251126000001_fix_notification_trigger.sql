-- Fix handle_new_notification function to use correct column names for agendamentos
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_type TEXT;
    v_link TEXT;
    v_priority TEXT := 'medium';
BEGIN
    -- Determine user_id based on table
    IF TG_TABLE_NAME = 'agendamentos' THEN
        v_user_id := NEW.user_id;
        v_type := 'appointment';
        v_title := 'Novo Agendamento';
        -- Fixed: use 'data' and 'hora' columns instead of 'data_inicio'
        v_message := 'Novo agendamento criado para ' || to_char(NEW.data, 'DD/MM') || ' às ' || to_char(NEW.hora, 'HH24:MI');
        v_link := '/agendamentos';
        v_priority := 'high';
    ELSIF TG_TABLE_NAME = 'financeiro_tattoo' THEN
        v_user_id := NEW.user_id;
        v_type := 'payment';
        IF NEW.tipo = 'RECEITA' THEN
            v_title := 'Pagamento Recebido';
            v_message := 'Receita de ' || to_char(NEW.valor, 'L999G999D99') || ' registrada.';
            v_priority := 'high';
        ELSE
            v_title := 'Nova Despesa';
            v_message := 'Despesa de ' || to_char(NEW.valor, 'L999G999D99') || ' registrada.';
            v_priority := 'low';
        END IF;
        v_link := '/financeiro';
    ELSIF TG_TABLE_NAME = 'clientes' THEN
        v_user_id := NEW.user_id;
        v_type := 'client';
        v_title := 'Novo Cliente';
        v_message := 'Cliente ' || NEW.nome || ' cadastrado.';
        v_link := '/clientes/' || NEW.id;
        v_priority := 'medium';
    END IF;

    -- Insert notification
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, priority)
        VALUES (v_user_id, v_type, v_title, v_message, v_link, v_priority);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
