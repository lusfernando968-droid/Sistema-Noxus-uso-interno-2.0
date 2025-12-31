-- Create assistant activity logs table
create table if not exists public.assistant_activity_logs (
    id uuid default gen_random_uuid() primary key,
    assistant_id uuid not null references auth.users(id),
    admin_id uuid not null references auth.users(id),
    action_type text not null, -- 'PAGE_VIEW', 'CREATE_CLIENT', 'CREATE_PROJECT', 'CREATE_APPOINTMENT'
    entity_id uuid, -- ID of the created entity (optional)
    details jsonb default '{}'::jsonb, -- path for page view, etc
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.assistant_activity_logs enable row level security;

-- Policies
create policy "Admins can view their assistants logs"
on public.assistant_activity_logs for select
to authenticated
using (auth.uid() = admin_id);

create policy "Assistants can insert their own logs"
on public.assistant_activity_logs for insert
to authenticated
with check (
    auth.uid() = assistant_id
);

-- Index for faster queries
create index if not exists idx_assistant_activity_logs_assistant_id on public.assistant_activity_logs(assistant_id);
create index if not exists idx_assistant_activity_logs_admin_id on public.assistant_activity_logs(admin_id);
create index if not exists idx_assistant_activity_logs_created_at on public.assistant_activity_logs(created_at);

-- Function to handle auto-logging for DB creates (Clients, Projects, etc)
create or replace function public.handle_assistant_activity()
returns trigger as $$
declare
    v_admin_id uuid;
begin
    -- Check if the current user is an assistant
    -- We find the admin they work for.
    select user_id into v_admin_id
    from public.assistants
    where assistant_id = auth.uid()
    limit 1;

    -- If found, it means the current user is an assistant
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

-- Triggers

-- Clients
drop trigger if exists log_assistant_client on public.clientes;
create trigger log_assistant_client
after insert on public.clientes
for each row execute function public.handle_assistant_activity('CREATE_CLIENT');

-- Projects (assuming 'projetos' covers budgets/projects)
drop trigger if exists log_assistant_project on public.projetos;
create trigger log_assistant_project
after insert on public.projetos
for each row execute function public.handle_assistant_activity('CREATE_PROJECT');

-- Appointments
drop trigger if exists log_assistant_appointment on public.agendamentos;
create trigger log_assistant_appointment
after insert on public.agendamentos
for each row execute function public.handle_assistant_activity('CREATE_APPOINTMENT');
