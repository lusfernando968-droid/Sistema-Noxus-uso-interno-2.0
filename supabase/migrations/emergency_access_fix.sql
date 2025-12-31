-- Emergency fix for infinite loading due to RLS
-- This ensures that valid authenticated users can at least READ the profiles and assistants
-- to determine their roles.

-- Fix Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read access" ON profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
END $$;

CREATE POLICY "Allow read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Fix Assistants RLS
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can view assistants" ON assistants;
    DROP POLICY IF EXISTS "Assistants can view themselves" ON assistants;
END $$;

CREATE POLICY "Allow read access for authenticated users"
ON assistants FOR SELECT
TO authenticated
USING (true);

-- Ensure user_roles is also readable
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Read access for authenticated users" ON user_roles;
END $$;

CREATE POLICY "Read access for authenticated users"
ON user_roles FOR SELECT
TO authenticated
USING (true);
