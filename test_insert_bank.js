import { supabase } from "@/integrations/supabase/client";

// Teste de inserção de banco
async function testInsertBank() {
  console.log("🧪 Iniciando teste de inserção de banco...");
  
  const testBank = {
    nome_curto: "Banco Teste",
    nome: "Banco Teste S.A.",
    codigo: "999",
    cor_primaria: "#FF0000",
    ativo: true
  };
  
  console.log("📊 Dados do teste:", testBank);
  
  try {
    // Teste 1: Verificar permissões
    console.log("🔍 Teste 1: Verificando permissões...");
    const { data: permissionTest, error: permissionError } = await supabase
      .from("bancos")
      .select("id")
      .limit(1);
    
    if (permissionError) {
      console.error("❌ Erro de permissão ao consultar:", permissionError);
    } else {
      console.log("✅ Permissão de consulta OK");
    }
    
    // Teste 2: Tentar inserir
    console.log("💾 Teste 2: Tentando inserir...");
    const { data, error } = await supabase
      .from("bancos")
      .insert([testBank])
      .select()
      .single();
    
    if (error) {
      console.error("❌ Erro na inserção:", error);
      console.error("📋 Detalhes:", error.details);
      console.error("🔑 Código:", error.code);
      console.error("💡 Mensagem:", error.message);
      
      // Verificar se é erro de permissão
      if (error.code === '42501') {
        console.error("🚫 Erro de permissão (RLS): Verifique as regras de segurança");
      }
      if (error.code === '23505') {
        console.error("🔢 Código duplicado: Este código de banco já existe");
      }
      if (error.code === '23502') {
        console.error("📋 Campo obrigatório faltando:", error.column_name);
      }
    } else {
      console.log("✅ Banco inserido com sucesso!");
      console.log("📊 Dados retornados:", data);
      
      // Teste 3: Verificar se foi realmente inserido
      console.log("🔍 Teste 3: Verificando inserção...");
      const { data: verifyData, error: verifyError } = await supabase
        .from("bancos")
        .select("*")
        .eq("id", data.id)
        .single();
      
      if (verifyError) {
        console.error("❌ Erro ao verificar:", verifyError);
      } else {
        console.log("✅ Verificação bem-sucedida:", verifyData);
      }
    }
    
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar teste
testInsertBank();