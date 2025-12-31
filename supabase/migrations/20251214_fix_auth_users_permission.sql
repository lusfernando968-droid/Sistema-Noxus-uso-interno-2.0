-- Migration: Grant access to auth.users for authenticated users and service_role
-- Reason: To resolve "permission denied for table users" errors.
-- Analysis confirmed that 'authenticated' role has NO grants on auth.users.

-- 1. Grant USAGE on schema auth (usually granted, but good to ensure)
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;

-- 2. Grant SELECT on auth.users
-- This allows the application to read user data (like email, id) which is critical for 
-- foreign key checks and some scalar subqueries in RLS policies or triggers.
GRANT SELECT ON TABLE auth.users TO authenticated;
GRANT SELECT ON TABLE auth.users TO service_role;

-- 3. Ensure postgres (deployer) has access (it already does, but safe)
GRANT ALL ON TABLE auth.users TO postgres;
