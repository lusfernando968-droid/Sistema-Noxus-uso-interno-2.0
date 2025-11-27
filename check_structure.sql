
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('financeiro_geral', 'transacoes');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'financeiro_geral';
