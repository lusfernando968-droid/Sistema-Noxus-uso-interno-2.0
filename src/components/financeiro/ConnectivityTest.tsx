import { useEffect, useState } from "react";

export const ConnectivityTest = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [consoleAvailable, setConsoleAvailable] = useState(false);
  const [clickDetected, setClickDetected] = useState(false);

  useEffect(() => {
    // Testar disponibilidade do console
    setConsoleAvailable(typeof console !== 'undefined' && typeof console.log === 'function');
    
    // Monitorar status online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    console.log("=== CONNECTIVITY TEST MOUNTED ===");
    console.log("Navigator online:", navigator.onLine);
    console.log("Console available:", typeof console !== 'undefined');
    console.log("Window object:", typeof window);
    console.log("Document object:", typeof document);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestClick = () => {
    console.log("=== CONNECTIVITY BUTTON CLICKED ===");
    setClickDetected(true);
    
    // Testar diferentes métodos de alerta
    if (typeof alert === 'function') {
      alert("Botão funcionando! Verifique o console para mais detalhes.");
    } else {
      console.log("Alert function not available");
    }
  };

  return (
    <div className="p-4 border-2 border-purple-500 rounded-lg bg-purple-50">
      <h3 className="text-lg font-bold mb-2 text-purple-800">Teste de Conectividade</h3>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span>Status Online:</span>
          <span className={isOnline ? "text-green-600" : "text-red-600"}>
            {isOnline ? "✅ Online" : "❌ Offline"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Console Disponível:</span>
          <span className={consoleAvailable ? "text-green-600" : "text-red-600"}>
            {consoleAvailable ? "✅ Sim" : "❌ Não"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Clique Detectado:</span>
          <span className={clickDetected ? "text-green-600" : "text-gray-600"}>
            {clickDetected ? "✅ Sim" : "🔄 Aguardando"}
          </span>
        </div>
      </div>
      
      <button
        onClick={handleTestClick}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold"
        style={{ cursor: 'pointer' }}
      >
        TESTAR CONECTIVIDADE
      </button>
      
      {clickDetected && (
        <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-xs">
          ✅ Clique detectado com sucesso! O JavaScript está funcionando.
        </div>
      )}
    </div>
  );
};