-- Migration: Fix permissions for public.users
-- Description: Explicitly grants SELECT permission on public.users to authenticated role
-- This is to resolve "permission denied for table users" errors seen in the logs.

DO $$
BEGIN
    -- Check if the table exists to avoid errors if it's missing (though the error implies it exists)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Grant access to authenticated users
        GRANT SELECT ON TABLE public.users TO authenticated;
        
        -- Grant access to service_role (usually has it, but good to ensure)
        GRANT ALL ON TABLE public.users TO service_role;
        
        RAISE NOTICE 'Permissions granted on public.users';
    ELSE
        RAISE NOTICE 'Table public.users does not exist, skipping grants';
    END IF;
END $$;
