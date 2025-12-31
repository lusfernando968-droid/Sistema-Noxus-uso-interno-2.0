-- 1. Function to sync assistant_id when a user triggers it (or on login/signup)
create or replace function public.sync_assistant_user_id()
returns trigger as $$
begin
    -- Update assistant_id for any invitation pending for this email
    update public.assistants
    set assistant_id = NEW.id
    where assistant_email = NEW.email
    and assistant_id is null;
    return NEW;
end;
$$ language plpgsql security definer;

-- 2. Trigger on auth.users to sync on creation
-- Note: In Supabase, you can create triggers on auth.users.
drop trigger if exists sync_assistant_on_signup on auth.users;
create trigger sync_assistant_on_signup
after insert on auth.users
for each row execute function public.sync_assistant_user_id();

-- 3. Update existing assistants that might be null but user exists
do $$
begin
    update public.assistants a
    set assistant_id = u.id
    from auth.users u
    where a.assistant_email = u.email
    and a.assistant_id is null;
end $$;

-- 4. Improve handle_assistant_activity to fallback to email lookup
create or replace function public.handle_assistant_activity()
returns trigger as $$
declare
    v_admin_id uuid;
    v_user_email text;
begin
    -- Try to find by ID first
    select user_id into v_admin_id
    from public.assistants
    where assistant_id = auth.uid()
    limit 1;

    -- If not found, try by email (robustness)
    if v_admin_id is null then
        select email into v_user_email from auth.users where id = auth.uid();
        
        if v_user_email is not null then
            select user_id into v_admin_id
            from public.assistants
            where assistant_email = v_user_email
            limit 1;
            
            -- If we found it by email but ID was null, let's self-heal (optional, but good)
            if v_admin_id is not null then
                update public.assistants 
                set assistant_id = auth.uid() 
                where user_id = v_admin_id and assistant_email = v_user_email;
            end if;
        end if;
    end if;

    -- If found, log it
    if v_admin_id is not null then
        insert into public.assistant_activity_logs (assistant_id, admin_id, action_type, entity_id, details)
        values (
            auth.uid(),
            v_admin_id,
            TG_ARGV[0], -- Action type passed as argument
            NEW.id,
            jsonb_build_object('table', TG_TABLE_NAME)
        );
    end if;
    return NEW;
end;
$$ language plpgsql security definer;
