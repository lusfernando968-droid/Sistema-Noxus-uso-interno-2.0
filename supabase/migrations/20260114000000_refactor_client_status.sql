-- Refactor Client Statuses (FINAL FIX)
-- Date: 2026-01-14

-- 1. Unify Statuses to 'cliente'

-- A) Any client with Revenue (LTV > 0) is definitely a Client.
-- We check the 'clientes_com_ltv' view for this.
UPDATE public.clientes 
SET status = 'cliente' 
WHERE id IN (
    SELECT id FROM public.clientes_com_ltv WHERE ltv > 0
);

-- B) Any client that has at least one Project (even if LTV is 0) should be a Client.
UPDATE public.clientes
SET status = 'cliente'
WHERE id IN (SELECT DISTINCT cliente_id FROM public.projetos);

-- C) Any client that was manually marked as 'efetivado' previously.
UPDATE public.clientes 
SET status = 'cliente' 
WHERE status = 'efetivado';

-- D) Handle leftovers:
-- If status is NULL or invalid, default to 'cliente' (safest path to avoid "downgrading" existing clients to Leads).
-- Only Leads coming from Budgets (who are effectively new) stay as Leads if they haven't closed yet.
UPDATE public.clientes 
SET status = 'cliente' 
WHERE status IS NULL OR status NOT IN ('lead', 'cliente', 'desativado');

-- 2. Add/Update Constraint
DO $$ BEGIN
    ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_status_check;
EXCEPTION
    WHEN others THEN NULL;
END $$;

ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_status_check 
CHECK (status IN ('lead', 'cliente', 'desativado'));

-- 3. Set Default
ALTER TABLE public.clientes 
ALTER COLUMN status SET DEFAULT 'lead';
