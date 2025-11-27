
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kkmnhpbbkkrkwbgnqxfy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbW5ocGJia2tya3diZ25xeGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0NTQxMzUsImV4cCI6MjA0NzAzMDEzNX0.1WQ3LVALE3q2W3fN3XaQhL3Xb3xZ3Y3Z3Y3Z3Y3Z3Y3Z';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    console.log('--- Verificando Estrutura Financeiro (Tentativa 2) ---');

    try {
        // Check financeiro_geral
        const { data: financeiro, error: fError } = await supabase
            .from('financeiro_geral')
            .select('*')
            .limit(1);

        if (fError) {
            console.error('Erro ao ler financeiro_geral:', fError.message);
        } else if (financeiro && financeiro.length > 0) {
            console.log('Keys em financeiro_geral:', Object.keys(financeiro[0]));
        } else {
            console.log('financeiro_geral está vazia ou não retornou dados.');
        }

        // Check transacoes
        const { data: transacoes, error: tError } = await supabase
            .from('transacoes')
            .select('*')
            .limit(1);

        if (tError) {
            console.error('Erro ao ler transacoes:', tError.message);
        } else if (transacoes && transacoes.length > 0) {
            console.log('Keys em transacoes:', Object.keys(transacoes[0]));
        } else {
            console.log('transacoes está vazia ou não retornou dados.');
        }
    } catch (e) {
        console.error('Exceção:', e);
    }
}

check();
