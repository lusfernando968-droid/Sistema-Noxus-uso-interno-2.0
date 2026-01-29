alter table "public"."agendamentos" add column "valor_sinal" numeric default '0'::numeric;
alter table "public"."agendamentos" add column "data_pagamento_sinal" date;
