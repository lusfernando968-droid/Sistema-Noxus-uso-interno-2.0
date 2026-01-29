DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'status') THEN
        ALTER TABLE "public"."clientes" ADD COLUMN "status" text NOT NULL DEFAULT 'ativo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'motivo_inativacao') THEN
        ALTER TABLE "public"."clientes" ADD COLUMN "motivo_inativacao" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_status_check') THEN
         ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_status_check" CHECK (status IN ('ativo', 'inativo'));
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
