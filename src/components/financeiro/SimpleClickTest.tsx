import { useState } from "react";

export const SimpleClickTest = () => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClick, setLastClick] = useState<string>("");

  const handleClick = () => {
    const now = new Date().toLocaleTimeString();
    console.log(`=== SIMPLE CLICK TEST ===`);
    console.log(`Botão clicado às: ${now}`);
    console.log(`Contador anterior: ${clickCount}`);
    
    setClickCount(prev => prev + 1);
    setLastClick(now);
    
    // Testar se o alert funciona
    alert(`Botão clicado! Contador: ${clickCount + 1}`);
  };

  console.log(`SimpleClickTest renderizado - Contador atual: ${clickCount}`);

  return (
    <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
      <h3 className="text-lg font-bold mb-2 text-blue-800">Teste Simples de Clique</h3>
      <button
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold"
      >
        CLIQUE AQUI PARA TESTAR
      </button>
      <div className="mt-2 text-sm text-blue-700">
        <p>Cliques detectados: <strong>{clickCount}</strong></p>
        <p>Último clique: <strong>{lastClick || "Nenhum"}</strong></p>
      </div>
    </div>
  );
};