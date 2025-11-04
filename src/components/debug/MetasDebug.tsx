import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMetas } from '@/hooks/useMetas';
import { checkTablesExist, executeMigration } from '@/utils/executeMigration';
import { toast } from 'sonner';

export function MetasDebug() {
  const { metas, metasStats, isLoading, error, createMeta } = useMetas();
  
  const getLocalStorageInfo = () => {
    try {
      const keys = Object.keys(localStorage);
      const metasKeys = keys.filter(key => key.includes('meta') || key.includes('goal'));
      return {
        totalKeys: keys.length,
        metasKeys,
        storageSize: JSON.stringify(localStorage).length
      };
    } catch (err) {
      return { error: 'Erro ao acessar localStorage' };
    }
  };
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleCheckTables = async () => {
    try {
      const exists = await checkTablesExist();
      setDebugInfo(`Tabelas existem: ${exists}`);
      toast.info(`Tabelas existem: ${exists}`);
    } catch (err) {
      setDebugInfo(`Erro ao verificar tabelas: ${err}`);
      toast.error('Erro ao verificar tabelas');
    }
  };

  const handleRunMigration = async () => {
    try {
      const result = await executeMigration();
      setDebugInfo(`Migração: ${result.success ? 'Sucesso' : 'Falha'} - ${result.message}`);
      toast.success('Migração executada');
    } catch (err) {
      setDebugInfo(`Erro na migração: ${err}`);
      toast.error('Erro na migração');
    }
  };

  const handleCreateTestMeta = async () => {
    try {
      const testMeta = {
        titulo: 'Meta de Teste',
        descricao: 'Esta é uma meta de teste para verificar o sistema',
        categoria: 'financeiro' as const,
        tipo: 'valor' as const,
        valor_meta: 10000,
        unidade: 'R$',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        prioridade: 'alta' as const,
        cor: '#10B981'
      };

      const result = await createMeta(testMeta);
      setDebugInfo(`Meta criada: ${result ? 'Sucesso' : 'Falha'}`);
    } catch (err) {
      setDebugInfo(`Erro ao criar meta: ${err}`);
      toast.error('Erro ao criar meta de teste');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Debug do Sistema de Metas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={handleCheckTables} variant="outline" size="sm">
            Verificar Tabelas
          </Button>
          <Button onClick={handleRunMigration} variant="outline" size="sm">
            Executar Migração
          </Button>
          <Button onClick={handleCreateTestMeta} variant="outline" size="sm">
            Criar Meta Teste
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Status do Sistema:</h4>
          <div className="text-sm space-y-1">
            <p>Loading: {isLoading ? '✅' : '❌'}</p>
            <p>Error: {error || 'Nenhum'}</p>
            <p>Total de Metas: {metas.length}</p>
            <p>Stats: {metasStats ? '✅' : '❌'}</p>
            <p>Modo: {metas.length > 0 ? 'LocalStorage (Offline)' : 'Aguardando dados'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">LocalStorage Info:</h4>
          <div className="text-sm space-y-1">
            {(() => {
              const info = getLocalStorageInfo();
              if ('error' in info) {
                return <p className="text-red-500">{info.error}</p>;
              }
              return (
                <>
                  <p>Total de chaves: {info.totalKeys}</p>
                  <p>Chaves relacionadas a metas: {info.metasKeys.length}</p>
                  <p>Tamanho do storage: {(info.storageSize / 1024).toFixed(2)} KB</p>
                </>
              );
            })()}
          </div>
        </div>

        {debugInfo && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <p className="text-sm">{debugInfo}</p>
          </div>
        )}

        {metas.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Metas Encontradas:</h4>
            {metas.slice(0, 3).map((meta) => (
              <div key={meta.id} className="p-2 bg-muted rounded text-sm">
                <p><strong>{meta.titulo}</strong></p>
                <p>Progresso: {meta.percentual_progresso?.toFixed(0) || 0}%</p>
                <p>Status: {meta.status}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
