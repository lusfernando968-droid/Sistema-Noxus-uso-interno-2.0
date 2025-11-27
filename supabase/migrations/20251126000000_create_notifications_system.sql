-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('appointment', 'payment', 'client', 'project', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    link TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to create notification
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
        -- Try to get client name if possible, otherwise generic
        v_message := 'Novo agendamento criado para ' || to_char(NEW.data_inicio, 'DD/MM HH24:MI');
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

-- Create triggers
DROP TRIGGER IF EXISTS trg_notify_new_agendamento ON public.agendamentos;
CREATE TRIGGER trg_notify_new_agendamento
    AFTER INSERT ON public.agendamentos
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

DROP TRIGGER IF EXISTS trg_notify_new_financeiro ON public.financeiro_tattoo;
CREATE TRIGGER trg_notify_new_financeiro
    AFTER INSERT ON public.financeiro_tattoo
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

DROP TRIGGER IF EXISTS trg_notify_new_cliente ON public.clientes;
CREATE TRIGGER trg_notify_new_cliente
    AFTER INSERT ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();
