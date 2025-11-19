export const DirectHTMLTest = () => {
  // Esta função será chamada diretamente no onclick do HTML
  const handleDirectClick = () => {
    console.log("=== DIRECT HTML BUTTON CLICKED ===");
    alert("HTML Button Clicked! This should work if JavaScript is enabled.");
  };

  // Adicionar event listener após o componente montar
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const button = document.getElementById('direct-html-button');
      if (button) {
        button.addEventListener('click', () => {
          console.log("=== EVENT LISTENER ATTACHED TO BUTTON ===");
          alert("Event listener button clicked!");
        });
        console.log("Event listener attached to button");
      }
    }, 1000);
  }

  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
      <h3 className="text-lg font-bold mb-2 text-red-800">Teste Direto HTML</h3>
      <p className="text-sm text-red-700 mb-3">
        Testando com HTML puro e event listeners
      </p>
      
      {/* Botão com onclick inline */}
      <button
        id="direct-html-button"
        onClick={handleDirectClick}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold mr-2"
        style={{ cursor: 'pointer' }}
      >
        BOTÃO HTML DIRECTO
      </button>
      
      {/* Botão com onclick inline no HTML */}
      <button
        onClick={() => {
          console.log("=== INLINE ARROW FUNCTION CLICKED ===");
          alert("Inline arrow function clicked!");
        }}
        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold"
        style={{ cursor: 'pointer' }}
      >
        INLINE ARROW FUNCTION
      </button>
    </div>
  );
};