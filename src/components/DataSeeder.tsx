import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTemporaryReferrals } from "@/hooks/useTemporaryReferrals";
import { Database, Users, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
interface ClienteData {
  nome: string;
  email: string;
  telefone: string;
  indicado_por?: string;
}
export function DataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    setReferral
  } = useTemporaryReferrals();

  // Dados fictícios realistas
  const clientesData: ClienteData[] = [
  // Nível 0 - Clientes Raiz (Influenciadores)
  {
    nome: "Carlos Silva",
    email: "carlos.silva@email.com",
    telefone: "(11) 99999-0001"
  }, {
    nome: "Ana Costa",
    email: "ana.costa@email.com",
    telefone: "(11) 99999-0002"
  }, {
    nome: "Roberto Santos",
    email: "roberto.santos@email.com",
    telefone: "(11) 99999-0003"
  },
  // Nível 1 - Indicados pelos influenciadores
  {
    nome: "Maria Oliveira",
    email: "maria.oliveira@email.com",
    telefone: "(11) 99999-0004",
    indicado_por: "Carlos Silva"
  }, {
    nome: "João Pereira",
    email: "joao.pereira@email.com",
    telefone: "(11) 99999-0005",
    indicado_por: "Carlos Silva"
  }, {
    nome: "Fernanda Lima",
    email: "fernanda.lima@email.com",
    telefone: "(11) 99999-0006",
    indicado_por: "Ana Costa"
  }, {
    nome: "Pedro Alves",
    email: "pedro.alves@email.com",
    telefone: "(11) 99999-0007",
    indicado_por: "Ana Costa"
  }, {
    nome: "Juliana Rocha",
    email: "juliana.rocha@email.com",
    telefone: "(11) 99999-0008",
    indicado_por: "Roberto Santos"
  },
  // Nível 2 - Indicados pelos clientes do nível 1
  {
    nome: "Lucas Martins",
    email: "lucas.martins@email.com",
    telefone: "(11) 99999-0009",
    indicado_por: "Maria Oliveira"
  }, {
    nome: "Camila Souza",
    email: "camila.souza@email.com",
    telefone: "(11) 99999-0010",
    indicado_por: "Maria Oliveira"
  }, {
    nome: "Rafael Dias",
    email: "rafael.dias@email.com",
    telefone: "(11) 99999-0011",
    indicado_por: "João Pereira"
  }, {
    nome: "Beatriz Ferreira",
    email: "beatriz.ferreira@email.com",
    telefone: "(11) 99999-0012",
    indicado_por: "Fernanda Lima"
  }, {
    nome: "Thiago Barbosa",
    email: "thiago.barbosa@email.com",
    telefone: "(11) 99999-0013",
    indicado_por: "Fernanda Lima"
  }, {
    nome: "Larissa Gomes",
    email: "larissa.gomes@email.com",
    telefone: "(11) 99999-0014",
    indicado_por: "Pedro Alves"
  }, {
    nome: "Gabriel Ribeiro",
    email: "gabriel.ribeiro@email.com",
    telefone: "(11) 99999-0015",
    indicado_por: "Juliana Rocha"
  },
  // Nível 3 - Terceira geração
  {
    nome: "Amanda Torres",
    email: "amanda.torres@email.com",
    telefone: "(11) 99999-0016",
    indicado_por: "Lucas Martins"
  }, {
    nome: "Diego Carvalho",
    email: "diego.carvalho@email.com",
    telefone: "(11) 99999-0017",
    indicado_por: "Camila Souza"
  }, {
    nome: "Natália Mendes",
    email: "natalia.mendes@email.com",
    telefone: "(11) 99999-0018",
    indicado_por: "Rafael Dias"
  }, {
    nome: "Bruno Araújo",
    email: "bruno.araujo@email.com",
    telefone: "(11) 99999-0019",
    indicado_por: "Beatriz Ferreira"
  }, {
    nome: "Isabela Castro",
    email: "isabela.castro@email.com",
    telefone: "(11) 99999-0020",
    indicado_por: "Thiago Barbosa"
  },
  // Clientes adicionais sem indicação (diretos)
  {
    nome: "Eduardo Nunes",
    email: "eduardo.nunes@email.com",
    telefone: "(11) 99999-0021"
  }, {
    nome: "Patrícia Lopes",
    email: "patricia.lopes@email.com",
    telefone: "(11) 99999-0022"
  }, {
    nome: "Marcos Vieira",
    email: "marcos.vieira@email.com",
    telefone: "(11) 99999-0023"
  },
  // Mais alguns indicados para criar uma rede mais densa
  {
    nome: "Vanessa Cardoso",
    email: "vanessa.cardoso@email.com",
    telefone: "(11) 99999-0024",
    indicado_por: "Eduardo Nunes"
  }, {
    nome: "Rodrigo Moreira",
    email: "rodrigo.moreira@email.com",
    telefone: "(11) 99999-0025",
    indicado_por: "Patrícia Lopes"
  }, {
    nome: "Priscila Ramos",
    email: "priscila.ramos@email.com",
    telefone: "(11) 99999-0026",
    indicado_por: "Marcos Vieira"
  }, {
    nome: "Felipe Correia",
    email: "felipe.correia@email.com",
    telefone: "(11) 99999-0027",
    indicado_por: "Vanessa Cardoso"
  }, {
    nome: "Renata Freitas",
    email: "renata.freitas@email.com",
    telefone: "(11) 99999-0028",
    indicado_por: "Rodrigo Moreira"
  }];
  const seedData = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }
    setIsSeeding(true);
    setStatus('seeding');
    setProgress(0);
    setMessage('Iniciando povoação...');
    try {
      const clienteMap = new Map<string, string>(); // nome -> id

      // Primeiro, criar todos os clientes sem indicação
      for (let i = 0; i < clientesData.length; i++) {
        const cliente = clientesData[i];
        setProgress(i / clientesData.length * 50); // Primeira metade do progresso
        setMessage(`Criando cliente: ${cliente.nome}`);
        const {
          data,
          error
        } = await supabase.from("clientes").insert([{
          user_id: user.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone
        }]).select();
        if (error) {
          console.error("Erro ao criar cliente:", error);
          continue;
        }
        if (data && data[0]) {
          clienteMap.set(cliente.nome, data[0].id);
        }

        // Pequena pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Segundo, configurar as indicações usando o sistema temporário
      for (let i = 0; i < clientesData.length; i++) {
        const cliente = clientesData[i];
        setProgress(50 + i / clientesData.length * 50); // Segunda metade do progresso
        setMessage(`Configurando indicação: ${cliente.nome}`);
        if (cliente.indicado_por) {
          const clienteId = clienteMap.get(cliente.nome);
          const indicadorId = clienteMap.get(cliente.indicado_por);
          if (clienteId && indicadorId) {
            setReferral(clienteId, indicadorId);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      setProgress(100);
      setStatus('success');
      setMessage(`${clientesData.length} clientes criados com sucesso!`);
      toast({
        title: "Povoação Concluída!",
        description: `${clientesData.length} clientes foram adicionados ao sistema`
      });
    } catch (error) {
      console.error("Erro durante a povoação:", error);
      setStatus('error');
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({
        title: "Erro na Povoação",
        description: "Ocorreu um erro durante a criação dos dados",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };
  const clearData = async () => {
    if (!user) return;
    setIsSeeding(true);
    setStatus('seeding');
    setMessage('Limpando dados...');
    try {
      const {
        error
      } = await supabase.from("clientes").delete().eq("user_id", user.id);
      if (error) throw error;

      // Limpar dados temporários também
      localStorage.removeItem('temporary_referrals');
      setStatus('success');
      setMessage('Dados limpos com sucesso!');
      toast({
        title: "Dados Limpos",
        description: "Todos os clientes foram removidos"
      });
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      setStatus('error');
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({
        title: "Erro ao Limpar",
        description: "Não foi possível limpar os dados",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };
  const getStatusIcon = () => {
    switch (status) {
      case 'seeding':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Database className="w-5 h-5 text-muted-foreground" />;
    }
  };
  const getStatusBadge = () => {
    switch (status) {
      case 'seeding':
        return <Badge variant="secondary">Processando...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Pronto</Badge>;
    }
  };
  return <Card className="rounded-3xl border-0 shadow-xl max-w-2xl mx-auto">
      
      
      
    </Card>;
}