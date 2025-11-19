import { useEffect } from "react";

export const BasicJavaScriptTest = () => {
  useEffect(() => {
    console.log("=== BASIC JAVASCRIPT TEST MOUNTED ===");
    console.log("Window object:", typeof window);
    console.log("Document object:", typeof document);
    console.log("addEventListener available:", typeof window.addEventListener);
    
    // Testar se cliques estão sendo capturados
    const testClick = () => {
      console.log("=== DOCUMENT CLICK DETECTED ===");
      console.log("Timestamp:", new Date().toISOString());
    };
    
    document.addEventListener('click', testClick);
    
    return () => {
      document.removeEventListener('click', testClick);
    };
  }, []);

  const handleButtonClick = () => {
    console.log("=== BUTTON CLICK HANDLER EXECUTED ===");
    alert("Button clicked! Check console for details.");
  };

  return (
    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
      <h3 className="text-lg font-bold mb-2 text-green-800">Teste Básico JavaScript</h3>
      <p className="text-sm text-green-700 mb-3">
        Abra o console (F12) e clique no botão abaixo
      </p>
      <button
        onClick={handleButtonClick}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
        style={{ cursor: 'pointer', zIndex: 9999 }}
      >
        TESTAR JAVASCRIPT
      </button>
    </div>
  );
};