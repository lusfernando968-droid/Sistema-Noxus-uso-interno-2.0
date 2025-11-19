import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export const DebugInfo = () => {
  const { user } = useAuth();
  const [clickLog, setClickLog] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const buttonText = target.textContent || target.tagName;
      const timestamp = new Date().toLocaleTimeString();
      
      const logEntry = `[${timestamp}] Clique detectado: ${buttonText}`;
      console.log(logEntry);
      
      setClickLog(prev => [...prev.slice(-4), logEntry]);
      setLastUpdate(new Date());
    };

    // Adicionar listener global de cliques
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-xs z-50">
      <div className="mb-2 font-bold">Debug Info</div>
      <div>User: {user ? '✅ Logado' : '❌ Não logado'}</div>
      <div>Última atualização: {lastUpdate.toLocaleTimeString()}</div>
      <div className="mt-2">
        <div className="font-bold mb-1">Últimos cliques:</div>
        {clickLog.length === 0 ? (
          <div className="text-gray-400">Nenhum clique detectado</div>
        ) : (
          clickLog.map((log, index) => (
            <div key={index} className="text-green-400">{log}</div>
          ))
        )}
      </div>
    </div>
  );
};