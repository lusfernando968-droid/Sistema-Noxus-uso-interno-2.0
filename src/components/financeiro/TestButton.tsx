import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export const TestButton = () => {
  const { user } = useAuth();
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    console.log('=== TEST BUTTON CLICKED ===');
    console.log('User:', user);
    console.log('Click count:', clickCount + 1);
    setClickCount(prev => prev + 1);
    alert('Botão de teste clicado! User: ' + (user ? 'Logado' : 'Não logado'));
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Botão Teste ({clickCount})
      </Button>
      
      <div className="text-xs text-gray-500">
        Status: {user ? `Logado como ${user.email}` : 'Não logado'}
      </div>
    </div>
  );
};