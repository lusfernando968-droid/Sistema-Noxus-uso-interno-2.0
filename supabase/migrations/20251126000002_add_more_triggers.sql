-- Update notification type check to include new types if needed
-- Note: 'project' and 'system' are already in the check constraint from previous migration

-- 1. Trigger for Project Status Change (Completion)
CREATE OR REPLACE FUNCTION public.handle_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if status changed to 'concluido'
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluido' THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, priority)
        VALUES (
            NEW.user_id, 
            'project', 
            'Projeto Concluído', 
            'O projeto "' || NEW.titulo || '" foi marcado como concluído.', 
            '/projetos/' || NEW.id, 
            'high'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_project_completion ON public.projetos;
CREATE TRIGGER trg_notify_project_completion
    AFTER UPDATE ON public.projetos
    FOR EACH ROW EXECUTE FUNCTION public.handle_project_status_change();

-- 2. Trigger for Goal Achievement
CREATE OR REPLACE FUNCTION public.handle_goal_achievement()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if goal was just reached (current value >= target value, and previously it wasn't)
    IF NEW.valor_atual >= NEW.valor_meta AND (OLD.valor_atual < OLD.valor_meta OR OLD.valor_atual IS NULL) THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, priority)
        VALUES (
            NEW.user_id, 
            'system', 
            'Meta Atingida! 🎯', 
            'Parabéns! Você atingiu a meta "' || NEW.titulo || '".', 
            '/metas', 
            'high'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_goal_achievement ON public.metas;
CREATE TRIGGER trg_notify_goal_achievement
    AFTER UPDATE ON public.metas
    FOR EACH ROW EXECUTE FUNCTION public.handle_goal_achievement();

-- 3. Trigger for Low Stock (Inventory)
-- We'll assume a threshold of 5 units for now, or we could add a 'min_quantity' column later.
CREATE OR REPLACE FUNCTION public.handle_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify if quantity drops below 5 and was previously >= 5
    IF NEW.quantidade < 5 AND (OLD.quantidade >= 5 OR OLD.quantidade IS NULL) THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, priority)
        VALUES (
            NEW.user_id, 
            'system', 
            'Estoque Baixo ⚠️', 
            'O material "' || NEW.nome || '" está com estoque baixo (' || NEW.quantidade || ' ' || NEW.unidade || ').', 
            '/estoque', 
            'high'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_low_stock ON public.estoque_materiais;
CREATE TRIGGER trg_notify_low_stock
    AFTER UPDATE ON public.estoque_materiais
    FOR EACH ROW EXECUTE FUNCTION public.handle_low_stock();
