-- Add CURSO_NOXUS_MVP to platform check constraint
-- This fixes the error when creating content with platform "Curso Noxus MVP"

-- Drop the existing constraint
alter table public.conteudo_producao 
  drop constraint if exists conteudo_producao_plataforma_check;

-- Add the new constraint with CURSO_NOXUS_MVP included
alter table public.conteudo_producao 
  add constraint conteudo_producao_plataforma_check 
  check (plataforma in ('INSTAGRAM','FACEBOOK','TIKTOK','YOUTUBE','LINKEDIN','EMAIL','BLOG','CURSO_NOXUS_MVP'));
