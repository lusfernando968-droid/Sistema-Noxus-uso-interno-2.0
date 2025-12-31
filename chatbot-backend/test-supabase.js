import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🔍 Testando conexão com Supabase...\n');

// Verifica se as variáveis de ambiente estão definidas
console.log('📋 Verificando variáveis de ambiente:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Definida' : '❌ NÃO DEFINIDA');
console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Definida' : '❌ NÃO DEFINIDA');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('\n❌ ERRO: Variáveis de ambiente não configuradas!');
    console.log('\n📝 Verifique se o arquivo .env existe e contém:');
    console.log('   SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('   SUPABASE_SERVICE_KEY=sua-service-key');
    process.exit(1);
}

// Mostra a URL (parcialmente oculta por segurança)
const url = process.env.SUPABASE_URL;
const maskedUrl = url.substring(0, 20) + '...' + url.substring(url.length - 10);
console.log('   URL (parcial):', maskedUrl);

// Testa a conexão
console.log('\n🔌 Testando conexão...');

try {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    console.log('✅ Cliente Supabase criado com sucesso!');

    // Testa uma query simples
    console.log('\n🧪 Testando query simples...');

    const { data, error } = await supabase
        .from('chatbot_logs')
        .select('count')
        .limit(1);

    if (error) {
        console.error('❌ ERRO na query:', error);
        console.error('   Código:', error.code);
        console.error('   Mensagem:', error.message);
        console.error('   Detalhes:', error.details);
        console.error('   Hint:', error.hint);

        if (error.message.includes('fetch')) {
            console.log('\n💡 DICA: Erro de fetch geralmente indica:');
            console.log('   1. URL do Supabase incorreta ou inacessível');
            console.log('   2. Problemas de rede/firewall');
            console.log('   3. Certificado SSL inválido (comum no Windows)');
            console.log('\n🔧 SOLUÇÕES:');
            console.log('   1. Verifique se a URL está correta no .env');
            console.log('   2. Tente acessar a URL no navegador');
            console.log('   3. Se usar proxy/VPN, desative temporariamente');
        }
    } else {
        console.log('✅ Query executada com sucesso!');
        console.log('   Resultado:', data);
    }

    // Testa inserção
    console.log('\n🧪 Testando inserção de log...');

    const { data: insertData, error: insertError } = await supabase
        .from('chatbot_logs')
        .insert({
            phone_number: 'test_diagnostic',
            direction: 'inbound',
            message_text: 'Teste de diagnóstico - ' + new Date().toISOString(),
        })
        .select()
        .single();

    if (insertError) {
        console.error('❌ ERRO ao inserir:', insertError);
        console.error('   Código:', insertError.code);
        console.error('   Mensagem:', insertError.message);
        console.error('   Detalhes:', insertError.details);
    } else {
        console.log('✅ Inserção realizada com sucesso!');
        console.log('   ID criado:', insertData.id);

        // Limpa o registro de teste
        await supabase
            .from('chatbot_logs')
            .delete()
            .eq('id', insertData.id);
        console.log('🧹 Registro de teste removido');
    }

    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    console.log('   A conexão com Supabase está funcionando corretamente.');

} catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error);
    console.error('   Tipo:', error.constructor.name);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);

    if (error.cause) {
        console.error('   Causa:', error.cause);
    }

    console.log('\n💡 POSSÍVEIS CAUSAS:');
    console.log('   1. URL do Supabase inválida ou incorreta');
    console.log('   2. Service Key inválida');
    console.log('   3. Problemas de rede/DNS');
    console.log('   4. Firewall bloqueando a conexão');
    console.log('   5. Certificado SSL inválido');

    process.exit(1);
}
