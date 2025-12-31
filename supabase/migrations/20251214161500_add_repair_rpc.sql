-- Function to manually repair the link between assistant and auth.users
create or replace function public.repair_assistant_link(target_email text)
returns boolean as $$
declare
    v_user_id uuid;
    v_updated boolean := false;
begin
    -- Find the user in auth.users
    select id into v_user_id
    from auth.users
    where email = target_email
    limit 1;

    if v_user_id is not null then
        -- Update the assistants table
        update public.assistants
        set assistant_id = v_user_id
        where assistant_email = target_email
        and assistant_id is null;
        
        v_updated := FOUND;
    end if;

    return v_updated;
end;
$$ language plpgsql security definer;

-- Re-apply the robust trigger function just to be absolutely sure
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
            
            -- Self-heal
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
            TG_ARGV[0], 
            NEW.id,
            jsonb_build_object('table', TG_TABLE_NAME)
        );
    end if;
    return NEW;
end;
$$ language plpgsql security definer;
