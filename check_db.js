import { createClient } from '@supabase/supabase-js';

// Credentials from .env (or hardcoded for this check script based on previous context)
const SUPABASE_URL = 'https://kkmnhpbbkkrkwbgnqxfy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbW5ocGJia2tya3diZ25xeGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0NTQxMzUsImV4cCI6MjA0NzAzMDEzNX0.1WQ3LVALE3q2W3fN3XaQhL3Xb3xZ3Y3Z3Y3Z3Y3Z3Y3Z';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    console.log('--- Verificando Banco de Dados ---');

    // 1. Check if table exists by trying to select from it
    const { data, error } = await supabase
        .from('conteudo_producao')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Erro ao acessar tabela conteudo_producao:');
        console.error(error.message);
        if (error.code === 'PGRST204') {
            console.error('=> A tabela NÃO existe. A migração não foi aplicada corretamente.');
        }
    } else {
        console.log('✅ Tabela conteudo_producao existe!');

        // 2. Check row count
        const { count, error: countError } = await supabase
            .from('conteudo_producao')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Erro ao contar registros:', countError.message);
        } else {
            console.log(`📊 Total de registros encontrados: ${count}`);
        }
    }
}

check();
