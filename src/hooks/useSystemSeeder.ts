import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTemporaryReferrals } from "@/hooks/useTemporaryReferrals";

type ClienteSeed = {
  nome: string;
  email: string;
  telefone: string;
  indicado_por?: string;
};

export function useSystemSeeder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setReferral } = useTemporaryReferrals();

  const clientesData: ClienteSeed[] = [
    { nome: "Carlos Silva", email: "carlos.silva@email.com", telefone: "(11) 99999-0001" },
    { nome: "Ana Costa", email: "ana.costa@email.com", telefone: "(11) 99999-0002" },
    { nome: "Roberto Santos", email: "roberto.santos@email.com", telefone: "(11) 99999-0003" },
    { nome: "Maria Oliveira", email: "maria.oliveira@email.com", telefone: "(11) 99999-0004", indicado_por: "Carlos Silva" },
    { nome: "João Pereira", email: "joao.pereira@email.com", telefone: "(11) 99999-0005", indicado_por: "Carlos Silva" },
    { nome: "Fernanda Lima", email: "fernanda.lima@email.com", telefone: "(11) 99999-0006", indicado_por: "Ana Costa" },
    { nome: "Pedro Alves", email: "pedro.alves@email.com", telefone: "(11) 99999-0007", indicado_por: "Ana Costa" },
    { nome: "Juliana Rocha", email: "juliana.rocha@email.com", telefone: "(11) 99999-0008", indicado_por: "Roberto Santos" },
    { nome: "Lucas Martins", email: "lucas.martins@email.com", telefone: "(11) 99999-0009", indicado_por: "Maria Oliveira" },
    { nome: "Camila Souza", email: "camila.souza@email.com", telefone: "(11) 99999-0010", indicado_por: "Maria Oliveira" },
    { nome: "Rafael Dias", email: "rafael.dias@email.com", telefone: "(11) 99999-0011", indicado_por: "João Pereira" },
    { nome: "Beatriz Ferreira", email: "beatriz.ferreira@email.com", telefone: "(11) 99999-0012", indicado_por: "Fernanda Lima" },
    { nome: "Thiago Barbosa", email: "thiago.barbosa@email.com", telefone: "(11) 99999-0013", indicado_por: "Fernanda Lima" },
    { nome: "Larissa Gomes", email: "larissa.gomes@email.com", telefone: "(11) 99999-0014", indicado_por: "Pedro Alves" },
    { nome: "Gabriel Ribeiro", email: "gabriel.ribeiro@email.com", telefone: "(11) 99999-0015", indicado_por: "Juliana Rocha" },
    { nome: "Amanda Torres", email: "amanda.torres@email.com", telefone: "(11) 99999-0016", indicado_por: "Lucas Martins" },
    { nome: "Diego Carvalho", email: "diego.carvalho@email.com", telefone: "(11) 99999-0017", indicado_por: "Camila Souza" },
    { nome: "Natália Mendes", email: "natalia.mendes@email.com", telefone: "(11) 99999-0018", indicado_por: "Rafael Dias" },
    { nome: "Bruno Araújo", email: "bruno.araujo@email.com", telefone: "(11) 99999-0019", indicado_por: "Beatriz Ferreira" },
    { nome: "Isabela Castro", email: "isabela.castro@email.com", telefone: "(11) 99999-0020", indicado_por: "Thiago Barbosa" },
    { nome: "Eduardo Nunes", email: "eduardo.nunes@email.com", telefone: "(11) 99999-0021" },
    { nome: "Patrícia Lopes", email: "patricia.lopes@email.com", telefone: "(11) 99999-0022" },
    { nome: "Marcos Vieira", email: "marcos.vieira@email.com", telefone: "(11) 99999-0023" },
  ];

  async function seedClientes(clienteMap: Map<string, string>) {
    if (!user) throw new Error("Usuário não autenticado");
    for (const c of clientesData) {
      const { data, error } = await supabase
        .from("clientes")
        .insert({ user_id: user.id, nome: c.nome, email: c.email, telefone: c.telefone })
        .select();
      if (error) throw error;
      if (data && data[0]?.id) clienteMap.set(c.nome, data[0].id);
      await new Promise(r => setTimeout(r, 60));
    }
    // Indicações temporárias
    for (const c of clientesData) {
      if (c.indicado_por) {
        const cid = clienteMap.get(c.nome);
        const pid = clienteMap.get(c.indicado_por);
        if (cid && pid) setReferral(cid, pid);
      }
    }
  }

  async function seedAgendamentos(userId: string, projetos: any[]) {
    const now = new Date();
    const items = [
      { titulo: "Sessão de Fotos", data: new Date(now.getTime() + 86400000).toISOString(), projetoIndex: 0 },
      { titulo: "Reunião Comercial", data: new Date(now.getTime() + 2 * 86400000).toISOString(), projetoIndex: 1 },
      { titulo: "Entrega de Álbum", data: new Date(now.getTime() + 5 * 86400000).toISOString(), projetoIndex: 2 },
    ];
    const payload = items.map(i => ({
      user_id: userId,
      titulo: i.titulo,
      data: i.data,
      projeto_id: projetos[i.projetoIndex]?.id,
    }));
    const { data, error } = await supabase.from("agendamentos").insert(payload).select();
    if (error) throw error;
    return data || [];
  }

  async function seedProjetos(userId: string, clienteMap: Map<string, string>) {
    const projetos = [
      { titulo: "Ensaio Carlos", status: "andamento", clienteNome: "Carlos Silva" },
      { titulo: "Campanha Ana", status: "planejamento", clienteNome: "Ana Costa" },
      { titulo: "Casamento Roberto", status: "concluido", clienteNome: "Roberto Santos" },
    ];
    const payload = projetos.map(p => ({
      user_id: userId,
      titulo: p.titulo,
      descricao: `Projeto de ${p.clienteNome}`,
      status: p.status,
      cliente_id: clienteMap.get(p.clienteNome) || null,
    }));
    const { data, error } = await supabase.from("projetos").insert(payload).select();
    if (error) throw error;
    return data || [];
  }

  async function seedTransacoes(userId: string, agendamentos: any[]) {
    const categorias = ["Serviços", "Equipamentos", "Marketing", "Operacional"]; 
    const payload = [
      { tipo: "RECEITA", categoria: "Serviços", valor: 1500, descricao: "Ensaio premium", agendamento_id: agendamentos[0]?.id || null },
      { tipo: "DESPESA", categoria: "Equipamentos", valor: 450, descricao: "Aluguel de lente", agendamento_id: null },
      { tipo: "RECEITA", categoria: "Serviços", valor: 850, descricao: "Sessão express", agendamento_id: agendamentos[1]?.id || null },
    ].map(t => ({
      user_id: userId,
      tipo: t.tipo,
      categoria: t.categoria || categorias[Math.floor(Math.random() * categorias.length)],
      valor: t.valor,
      data_vencimento: new Date().toISOString().split('T')[0],
      descricao: t.descricao,
      agendamento_id: t.agendamento_id,
    }));
    const { error } = await supabase.from("transacoes").insert(payload);
    if (error) throw error;
  }

  async function clearAll() {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    try {
      await supabase.from("transacoes").delete().eq("user_id", user.id);
      await supabase.from("projetos").delete().eq("user_id", user.id);
      await supabase.from("agendamentos").delete().eq("user_id", user.id);
      await supabase.from("clientes").delete().eq("user_id", user.id);
      localStorage.removeItem('temporary_referrals');
      toast({ title: "Dados limpos", description: "Todas as tabelas foram esvaziadas." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao limpar", description: "Não foi possível limpar os dados.", variant: "destructive" });
    }
  }

  async function seedAll() {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    try {
      const clienteMap = new Map<string, string>();
      await seedClientes(clienteMap);
      const projetos = await seedProjetos(user.id, clienteMap);
      const ags = await seedAgendamentos(user.id, projetos);
      await seedTransacoes(user.id, ags);
      toast({ title: "Povoação concluída", description: "Clientes, projetos, agendamentos e transações criados." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro na povoação", description: e instanceof Error ? e.message : "Erro desconhecido", variant: "destructive" });
    }
  }

  return { seedAll, clearAll };
}