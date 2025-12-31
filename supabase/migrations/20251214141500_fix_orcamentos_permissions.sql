-- GRANT permissions for orcamentos table
GRANT ALL ON TABLE public.orcamentos TO postgres;
GRANT ALL ON TABLE public.orcamentos TO service_role;
GRANT ALL ON TABLE public.orcamentos TO authenticated;
GRANT ALL ON TABLE public.orcamentos TO anon;

-- Ensure sequence permission if id was serial (it is uuid, but good practice)
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Force RLS policy update just in case
DROP POLICY IF EXISTS "Users can create their own orcamentos" ON public.orcamentos;
CREATE POLICY "Users can create their own orcamentos" ON public.orcamentos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add a policy for Assistants to insert if they are not the 'user_id' owner? 
-- No, the code inserts { user_id: user.id }, so they ARE the owner.

-- Verify if public.update_updated_at_column exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
