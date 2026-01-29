ALTER TABLE "public"."clientes" 
ADD COLUMN "status" text NOT NULL DEFAULT 'ativo',
ADD COLUMN "motivo_inativacao" text;

-- Add a check constraint to ensure status is either 'ativo' or 'inativo'
ALTER TABLE "public"."clientes" 
ADD CONSTRAINT "clientes_status_check" CHECK (status IN ('ativo', 'inativo'));
