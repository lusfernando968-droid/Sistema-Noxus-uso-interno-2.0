// Teste rápido para executar no console do navegador
// Abra o console (F12) e cole este código

(function() {
    console.log('🧪 TESTE DE INSERÇÃO DE BANCO - DEBUG');
    
    // Função para testar inserção
    async function testInsertBank() {
        console.log('🔄 Iniciando teste...');
        
        // Dados de teste
        const testBank = {
            nome_curto: "Banco Console Teste",
            nome: "Banco Console Teste S.A.",
            codigo: "888",
            cor_primaria: "#00FF00",
            ativo: true
        };
        
        console.log('📊 Dados do teste:', testBank);
        
        try {
            // Verificar se supabase está disponível
            if (typeof window.supabase === 'undefined') {
                console.error('❌ Supabase não encontrado no window');
                return;
            }
            
            console.log('✅ Supabase encontrado');
            
            // Tentar inserir
            console.log('💾 Tentando inserir...');
            const { data, error } = await window.supabase
                .from("bancos")
                .insert([testBank])
                .select()
                .single();
            
            console.log('📡 Resultado:', { data, error });
            
            if (error) {
                console.error('❌ Erro detalhado:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                
                // Tratamento específico de erros
                switch(error.code) {
                    case '42501':
                        console.error('🚫 Permissão negada - RLS ou políticas restritivas');
                        break;
                    case '23505':
                        console.error('🔢 Código duplicado');
                        break;
                    case '23502':
                        console.error('📋 Campo obrigatório faltando:', error.column_name);
                        break;
                    case 'PGRST116':
                        console.error('🔍 Nenhum resultado encontrado');
                        break;
                    default:
                        console.error('❌ Erro não categorizado:', error.code);
                }
            } else {
                console.log('✅ SUCESSO! Banco inserido:', data);
                
                // Verificar se foi realmente inserido
                console.log('🔍 Verificando inserção...');
                const { data: verifyData, error: verifyError } = await window.supabase
                    .from("bancos")
                    .select("*")
                    .eq("id", data.id)
                    .single();
                
                if (verifyError) {
                    console.error('❌ Erro na verificação:', verifyError);
                } else {
                    console.log('✅ Verificação OK:', verifyData);
                }
            }
            
        } catch (err) {
            console.error('❌ Erro geral:', err);
        }
    }
    
    // Função para verificar bancos existentes
    async function checkExistingBanks() {
        console.log('📋 Verificando bancos existentes...');
        
        try {
            const { data, error } = await window.supabase
                .from("bancos")
                .select("id, codigo, nome_curto, nome")
                .order("codigo");
            
            if (error) {
                console.error('❌ Erro ao buscar bancos:', error);
            } else {
                console.log(`✅ Encontrados ${data.length} bancos:`);
                data.forEach(banco => {
                    console.log(`   ${banco.codigo}: ${banco.nome_curto} (${banco.nome})`);
                });
                
                // Verificar códigos que podem conflitar
                const testCodes = ['777', '888', '999', '998', '997'];
                testCodes.forEach(code => {
                    const exists = data.some(b => b.codigo === code);
                    if (exists) {
                        console.log(`⚠️  Código ${code} já está em uso`);
                    } else {
                        console.log(`✅ Código ${code} disponível`);
                    }
                });
            }
            
        } catch (err) {
            console.error('❌ Erro:', err);
        }
    }
    
    // Função para verificar autenticação
    async function checkAuth() {
        console.log('🔐 Verificando autenticação...');
        
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            
            if (error) {
                console.error('❌ Erro ao verificar usuário:', error);
            } else if (user) {
                console.log('✅ Usuário autenticado:', {
                    id: user.id,
                    email: user.email,
                    role: user.role
                });
            } else {
                console.log('⚠️ Nenhum usuário autenticado');
            }
            
            return user;
        } catch (err) {
            console.error('❌ Erro:', err);
            return null;
        }
    }
    
    // Disponibilizar funções globalmente
    window.debugBankFunctions = {
        testInsert: testInsertBank,
        checkBanks: checkExistingBanks,
        checkAuth: checkAuth,
        runFullTest: async function() {
            console.log('🚀 EXECUTANDO TESTE COMPLETO');
            await checkAuth();
            await checkExistingBanks();
            await testInsertBank();
        }
    };
    
    console.log('✅ Funções de debug disponíveis:');
    console.log('   - debugBankFunctions.testInsert()');
    console.log('   - debugBankFunctions.checkBanks()');
    console.log('   - debugBankFunctions.checkAuth()');
    console.log('   - debugBankFunctions.runFullTest()');
    
    console.log('💡 Dica: Execute debugBankFunctions.runFullTest() para teste completo');
})();