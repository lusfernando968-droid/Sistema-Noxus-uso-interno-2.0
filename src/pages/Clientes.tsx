import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, Trash2, FolderOpen, LayoutGrid, LayoutList, Table2, Save, X, Check, TrendingUp, DollarSign, Network, Eye, EyeOff, Users, User, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ReferralNetwork } from "@/components/clientes/ReferralNetwork";
import { DataSeeder } from "@/components/DataSeeder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTemporaryReferrals } from "@/hooks/useTemporaryReferrals";
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento?: string;
  endereco?: string;
  instagram?: string;
  cidade?: string;
  cidades?: string[];
  indicado_por?: string; // ID do cliente que indicou
  created_at: string;
}
interface ClienteComLTV extends Cliente {
  ltv: number;
  projetos_count: number;
  transacoes_count: number;
}
interface FiltrosClientes {
  cidades: string[];
  hasInstagram: boolean;
  ltvMin: number;
  ltvMax: number; // 0 significa sem limite superior
  dataInicio: string; // yyyy-mm-dd
  dataFim: string;    // yyyy-mm-dd
  tipoIndicacao: "todos" | "direto" | "indicado" | "indica_outros";
  indicadoPorId: string; // "todos" ou id específico
  projetosMin: number;
  transacoesMin: number;
}
const getLTVColor = (ltv: number, maxLtv: number) => {
  const percentage = maxLtv > 0 ? ltv / maxLtv * 100 : 0;
  if (percentage >= 75) return "text-success bg-success/10 border-success/20";
  if (percentage >= 50) return "text-primary bg-primary/10 border-primary/20";
  if (percentage >= 25) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  return "text-muted-foreground bg-muted/10 border-muted/20";
};
const getLTVLabel = (ltv: number) => {
  if (ltv >= 50000) return "VIP";
  if (ltv >= 20000) return "Premium";
  if (ltv >= 5000) return "Regular";
  if (ltv > 0) return "Novo";
  return "Sem faturamento";
};
const Clientes = () => {
  const [clientes, setClientes] = useState<ClienteComLTV[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTableFormOpen, setIsTableFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "grid" | "table" | "network">("table");
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editedData, setEditedData] = useState<Record<string, Partial<Cliente>>>({});
  const [sortBy, setSortBy] = useState<"nome" | "ltv" | "created_at">("ltv");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    instagram: "",
    cidade: "",
    indicado_por: ""
  });
  // Ref para container com scroll horizontal da tabela
  const tableScrollRef = useRef<HTMLDivElement>(null);
  // Ref para container visual da tabela (Card) para observar visibilidade
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  // Visibilidade da tabela na viewport (>= 50%)
  const [isTableVisible50, setIsTableVisible50] = useState(false);

  const updateArrowVisibility = () => {
    const el = tableScrollRef.current;
    if (!el) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft < maxScroll - 1);
  };


  useEffect(() => {
    const el = tableScrollRef.current;
    // Atualiza inicialmente (após layout)
    const init = () => updateArrowVisibility();
    const onScroll = () => updateArrowVisibility();
    const onResize = () => updateArrowVisibility();
    // Pequeno delay para garantir cálculo após renderização
    const t = setTimeout(init, 120);
    if (el) el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      if (el) el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [clientes.length, viewMode]);

  // Observer para mostrar setas apenas quando a tabela estiver >= 50% visível na viewport
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) {
      setIsTableVisible50(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        setIsTableVisible50(visible);
      },
      { threshold: [0.5] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode]);
  type CidadeOption = { id?: string; nome: string; created_at?: string };
  const [availableCities, setAvailableCities] = useState<CidadeOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<CidadeOption[]>([]);
  const [cityQuery, setCityQuery] = useState("");
  const [filterCityQuery, setFilterCityQuery] = useState("");
  const [cityRankingMode, setCityRankingMode] = useState<"mais_usadas" | "mais_recentes">("mais_usadas");
  const [cityUsageCounts, setCityUsageCounts] = useState<Record<string, number>>({});
  type ColKey = 'nome'|'email'|'telefone'|'instagram'|'cidade'|'ltv'|'categoria'|'indicado_por'|'indicados'|'projetos'|'acoes';
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    nome: true,
    email: true,
    telefone: true,
    instagram: true,
    cidade: true,
    ltv: true,
    categoria: true,
    indicado_por: true,
    indicados: true,
    projetos: true,
    acoes: true,
  });
  const colLabels: Record<ColKey, string> = {
    nome: 'Nome',
    email: 'Email',
    telefone: 'Telefone',
    instagram: 'Instagram',
    cidade: 'Cidade',
    ltv: 'LTV',
    categoria: 'Categoria',
    indicado_por: 'Indicado por',
    indicados: 'Indicados',
    projetos: 'Projetos',
    acoes: 'Ações',
  };
  const toggleCol = (key: ColKey) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));
  
  // Helper: retorna cidades ordenadas conforme ranking atual e filtradas
  const getRankedCities = (excludeNames: string[], query: string) => {
    const excludeLower = excludeNames.map(n => (n || "").toLowerCase());
    const filtered = availableCities.filter(c => {
      const notExcluded = !excludeLower.includes((c.nome || "").toLowerCase());
      const matchesQuery = query ? (c.nome.toLowerCase().includes(query.toLowerCase())) : true;
      return notExcluded && matchesQuery;
    });
    const byUsage = (name: string) => cityUsageCounts[name] || 0;
    const toTime = (c: CidadeOption) => c.created_at ? new Date(c.created_at).getTime() : 0;
    const sorted = [...filtered].sort((a, b) => {
      if (cityRankingMode === "mais_usadas") {
        const ua = byUsage(a.nome);
        const ub = byUsage(b.nome);
        if (ub !== ua) return ub - ua;
        // Empate: mais recente primeiro
        const tb = toTime(b) - toTime(a);
        if (tb !== 0) return tb;
        return a.nome.localeCompare(b.nome);
      } else {
        const tb = toTime(b) - toTime(a);
        if (tb !== 0) return tb;
        // Empate: mais usadas primeiro
        const ua = byUsage(a.nome);
        const ub = byUsage(b.nome);
        if (ub !== ua) return ub - ua;
        return a.nome.localeCompare(b.nome);
      }
    });
    // Limitar para evitar poluição visual
    return sorted.slice(0, 8);
  };
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    setReferral,
    getReferral
  } = useTemporaryReferrals();
  const [filtros, setFiltros] = useState<FiltrosClientes>({
    cidades: [],
    hasInstagram: false,
    ltvMin: 0,
    ltvMax: 0,
    dataInicio: "",
    dataFim: "",
    tipoIndicacao: "todos",
    indicadoPorId: "todos",
    projetosMin: 0,
    transacoesMin: 0
  });
  useEffect(() => {
    if (user) {
      fetchClientes();
      fetchAvailableCities();
    }
  }, [user]);

  const fetchAvailableCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cidades")
        .select("id, nome, created_at")
        .order("nome", { ascending: true });
      if (error) throw error;
      setAvailableCities((data || []).map((c: any) => ({ id: c.id, nome: c.nome, created_at: c.created_at })));
    } catch (err) {
      // Se a tabela não existir ou RLS bloquear, continuamos com multiselect local
      console.warn("Tabela 'cidades' indisponível. Multiselect funcionará localmente.");
    }
  };
  const fetchClientes = async () => {
    try {
      // Buscar clientes
      const {
        data: clientesData,
        error: clientesError
      } = await supabase.from("clientes").select("*").order("created_at", {
        ascending: false
      });
      if (clientesError) throw clientesError;

      // Buscar transações com seus relacionamentos
      const {
        data: transacoesData,
        error: transacoesError
      } = await supabase.from("transacoes").select(`
          id,
          valor,
          tipo,
          data_liquidacao,
          agendamento_id,
          agendamentos (
            projeto_id,
            projetos (
              cliente_id
            )
          )
        `);
      if (transacoesError) throw transacoesError;

      // Buscar projetos para contar quantos cada cliente tem
      const {
        data: projetosData,
        error: projetosError
      } = await supabase.from("projetos").select("id, cliente_id");
      if (projetosError) throw projetosError;

      // Buscar cidades vinculadas (se a tabela existir)
      let cidadesPorCliente: Record<string, string[]> = {};
      try {
        const { data: ccData, error: ccError } = await supabase
          .from("clientes_cidades")
          .select("cliente_id, cidades (nome)");
        if (ccError) throw ccError;
        (ccData || []).forEach((row: any) => {
          const nomeCidade = row.cidades?.nome as string | undefined;
          if (!nomeCidade) return;
          if (!cidadesPorCliente[row.cliente_id]) cidadesPorCliente[row.cliente_id] = [];
          cidadesPorCliente[row.cliente_id].push(nomeCidade);
        });
      } catch (err) {
        // Ignorar se tabela não existir
      }

      // Calcular LTV para cada cliente
      const clientesComLTV: ClienteComLTV[] = (clientesData || []).map(cliente => {
        // Contar projetos do cliente
        const projetos_count = (projetosData || []).filter(p => p.cliente_id === cliente.id).length;

        // Calcular LTV através das transações
        let ltv = 0;
        let transacoes_count = 0;
        (transacoesData || []).forEach(transacao => {
          // Verificar se a transação está vinculada a um projeto deste cliente
          const agendamento = transacao.agendamentos as any;
          if (agendamento?.projetos?.cliente_id === cliente.id) {
            transacoes_count++;
            // Somar apenas receitas liquidadas
            if (transacao.tipo === "RECEITA" && transacao.data_liquidacao) {
              ltv += Number(transacao.valor);
            }
          }
        });
        return {
          ...cliente,
          ltv,
          projetos_count,
          transacoes_count,
          // Prioriza valor do banco; usa temporário apenas como fallback
          indicado_por: (cliente as any).indicado_por ?? getReferral(cliente.id),
          cidades: cidadesPorCliente[cliente.id] || undefined
        };
      });

      // Ordenar por LTV por padrão
      clientesComLTV.sort((a, b) => b.ltv - a.ltv);
      setClientes(clientesComLTV);

      // Calcular contagem de uso por cidade (para ranking "mais usadas")
      const usage: Record<string, number> = {};
      (clientesComLTV || []).forEach(c => {
        const names = (c.cidades && c.cidades.length > 0) ? c.cidades : (c.cidade ? [c.cidade] : []);
        names.forEach(n => {
          const key = (n || "").trim();
          if (!key) return;
          usage[key] = (usage[key] || 0) + 1;
        });
      });
      setCityUsageCounts(usage);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // Apenas 'nome' obrigatório; enviar os demais campos somente se preenchidos
      const payload: any = {
        user_id: user.id,
        nome: formData.nome,
      };
      if (formData.email) payload.email = formData.email;
      if (formData.telefone) payload.telefone = formData.telefone;
      if (formData.instagram) payload.instagram = formData.instagram;
      if (formData.cidade) payload.cidade = formData.cidade;
      // Campos adicionais (instagram, cidade) serão tratados após migrações específicas
      // Persistir indicação diretamente no banco, se fornecida
      if (formData.indicado_por && formData.indicado_por !== "none") {
        payload.indicado_por = formData.indicado_por;
      }

      const cityNames: string[] = (selectedCities.length > 0
        ? selectedCities.map(c => (c.nome || '').trim()).filter(Boolean)
        : ((cityQuery || '').trim() ? [(cityQuery || '').trim()] : [])
      );

      const { data, error } = await supabase
        .from("clientes")
        .insert([payload])
        .select();
      if (error) throw error;

      // Indicação já persistida no banco (fallback local não necessário aqui)

      // Se houver cidades, garantir criação e vincular ao cliente
      if (data && data[0] && cityNames.length > 0) {
        try {
          // Criar cidades que não possuem id
          const ensuredCityIds: string[] = [];
          for (const nome of cityNames) {
            const existing = availableCities.find(c => (c.nome || '').toLowerCase() === nome.toLowerCase());
            if (existing?.id) {
              ensuredCityIds.push(existing.id);
            } else {
              const { data: created, error: createErr } = await supabase
                .from("cidades")
                .insert([{ user_id: user.id, nome }])
                .select();
              if (createErr) throw createErr;
              const createdId = created && created[0] ? created[0].id : undefined;
              if (createdId) {
                ensuredCityIds.push(createdId);
                setAvailableCities(prev => prev.some(x => (x.nome || '').toLowerCase() === nome.toLowerCase()) ? prev : [...prev, { id: createdId, nome, created_at: created?.[0]?.created_at }]);
              }
            }
          }
          if (ensuredCityIds.length > 0) {
            const rows = ensuredCityIds.map(cid => ({ user_id: user.id, cliente_id: data[0].id, cidade_id: cid }));
            const { error: linkErr } = await supabase.from("clientes_cidades").insert(rows);
            if (linkErr) throw linkErr;
          }
        } catch (linkError) {
          console.warn("Não foi possível vincular cidades ao cliente:", linkError);
        }
      }

      // Adicionar cliente ao estado local imediatamente
      if (data && data[0]) {
        const novoCliente: ClienteComLTV = {
          ...data[0],
          ltv: 0,
          projetos_count: 0,
          transacoes_count: 0,
          indicado_por: formData.indicado_por && formData.indicado_por !== "none" ? formData.indicado_por : null,
          cidades: cityNames.length > 0 ? cityNames : undefined
        };
        setClientes(prev => [novoCliente, ...prev]);
      }
      toast({
        title: "Cliente criado!",
        description: "O cliente foi adicionado com sucesso."
      });
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        instagram: "",
        cidade: "",
        indicado_por: ""
      });
      setSelectedCities([]);
      setCityQuery("");
      setIsDialogOpen(false);
      setIsTableFormOpen(false);
      // Não precisamos mais do fetchClientes() pois adicionamos ao estado local
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      // Fallback: se o banco não tiver as colunas instagram/cidade, tentar inserir sem elas
      try {
        // Fallback mínimo: inserir somente o obrigatório
        const { data } = await supabase
          .from("clientes")
          .insert([{ user_id: user.id, nome: formData.nome }])
          .select();
        if (data && data[0]) {
          const novoCliente: ClienteComLTV = {
            ...data[0],
            // manter campos locais não persistidos
            instagram: formData.instagram || undefined,
            cidade: formData.cidade || undefined,
            ltv: 0,
            projetos_count: 0,
            transacoes_count: 0,
            indicado_por: formData.indicado_por && formData.indicado_por !== "none" ? formData.indicado_por : null,
            cidades: selectedCities.length > 0 ? selectedCities.map(c => c.nome) : undefined
          } as any;
          setClientes(prev => [novoCliente, ...prev]);
        }
        toast({
          title: "Cliente criado!",
          description: "Alguns campos novos serão persistidos após migração do banco."
        });
        setFormData({
          nome: "",
          email: "",
          telefone: "",
          instagram: "",
          cidade: "",
          indicado_por: ""
        });
        setSelectedCities([]);
        setCityQuery("");
        setIsDialogOpen(false);
        setIsTableFormOpen(false);
        return;
      } catch (e2) {
        console.error("Fallback falhou ao criar cliente:", e2);
      }
      toast({
        title: "Erro ao criar cliente",
        description: "Não foi possível criar o cliente.",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;

      // Remover cliente do estado local imediatamente
      setClientes(prev => prev.filter(cliente => cliente.id !== id));
      toast({
        title: "Cliente removido!",
        description: "O cliente foi removido com sucesso."
      });

      // Não precisamos mais do fetchClientes() pois removemos do estado local
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      toast({
        title: "Erro ao remover cliente",
        description: "Não foi possível remover o cliente.",
        variant: "destructive"
      });
    }
  };
  const startEditing = (clienteId: string, cliente: Cliente) => {
    setEditingRows(prev => new Set(prev).add(clienteId));
    setEditedData(prev => ({
      ...prev,
      [clienteId]: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        instagram: cliente.instagram || "",
        cidade: cliente.cidade || "",
        indicado_por: cliente.indicado_por || "none"
      }
    }));
  };
  const cancelEditing = (clienteId: string) => {
    setEditingRows(prev => {
      const next = new Set(prev);
      next.delete(clienteId);
      return next;
    });
    setEditedData(prev => {
      const next = {
        ...prev
      };
      delete next[clienteId];
      return next;
    });
  };
  const saveEdit = async (clienteId: string) => {
    const data = editedData[clienteId];
    if (!data) return;
    try {
      // Separar dados de indicação dos outros dados
      const {
        indicado_por,
        ...clienteData
      } = data;

      // Atualizar dados básicos do cliente (sem indicado_por)
      const {
        error
      } = await supabase.from("clientes").update(clienteData).eq("id", clienteId);
      if (error) throw error;

      // Persistir indicação no banco se foi alterada
      if (indicado_por !== undefined) {
        const referralValue = indicado_por === "none" ? null : indicado_por;
        try {
          const { error: refErr } = await supabase
            .from("clientes")
            .update({ indicado_por: referralValue as any })
            .eq("id", clienteId);
          if (refErr) throw refErr;

          // Atualizar estado local imediatamente
          setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
            ...cliente,
            ...clienteData,
            indicado_por: referralValue || null
          } : cliente));
        } catch (refError) {
          // Fallback: salvar temporariamente caso coluna não exista
          setReferral(clienteId, referralValue);
          setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
            ...cliente,
            ...clienteData,
            indicado_por: referralValue || null
          } : cliente));
        }
      } else {
        // Atualizar apenas dados básicos se não há mudança de indicação
        setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
          ...cliente,
          ...clienteData
        } : cliente));
      }
      toast({
        title: "Cliente atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
      cancelEditing(clienteId);
      // Não precisamos mais do fetchClientes() pois atualizamos o estado local
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      // Fallback: tentar atualizar apenas campos existentes caso banco não tenha colunas novas
      try {
        const { error } = await supabase.from("clientes").update({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone
        }).eq("id", clienteId);
        if (!error) {
          // Atualizar estado local com campos novos sem persistência
          setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
            ...cliente,
            nome: data.nome ?? cliente.nome,
            email: data.email ?? cliente.email,
            telefone: data.telefone ?? cliente.telefone,
            instagram: (data as any).instagram ?? cliente.instagram,
            cidade: (data as any).cidade ?? cliente.cidade
          } : cliente));
          toast({
            title: "Cliente atualizado parcialmente",
            description: "Campos novos serão persistidos após migração do banco."
          });
          cancelEditing(clienteId);
          return;
        }
      } catch (e2) {
        console.error("Fallback falhou ao atualizar cliente:", e2);
      }
      toast({
        title: "Erro ao atualizar cliente",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };
  const updateEditedData = (clienteId: string, field: keyof Cliente, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [clienteId]: {
        ...prev[clienteId],
        [field]: value
      }
    }));
  };
  const saveAllEdits = async () => {
    const promises = Array.from(editingRows).map(id => saveEdit(id));
    await Promise.all(promises);
  };

  // Ação para aplicar dados variados de cidade e indicado_por
  const aplicarDadosVariados = async () => {
    try {
      const { data: clientesAtual, error: cliErr } = await supabase
        .from("clientes")
        .select("id, nome");
      if (cliErr) throw cliErr;

      const cidadesPool = [
        "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre",
        "Florianópolis", "Brasília", "Salvador", "Recife", "Fortaleza",
        "Campinas", "Santos", "Niterói", "Joinville", "Vitória"
      ];

      // Carregar cidades existentes para evitar duplicatas
      const { data: existingCities } = await supabase
        .from("cidades")
        .select("id, nome");
      const cityMap = new Map<string, string>(); // nome(lower) -> id
      (existingCities || []).forEach((c: any) => {
        if (c?.nome && c?.id) cityMap.set(String(c.nome).toLowerCase(), String(c.id));
      });

      const ensureCityId = async (nome: string): Promise<string | undefined> => {
        const key = (nome || "").toLowerCase();
        const found = cityMap.get(key);
        if (found) return found;
        const { data: created, error: createErr } = await supabase
          .from("cidades")
          .insert([{ user_id: user.id, nome }])
          .select();
        if (createErr) throw createErr;
        const id = created?.[0]?.id as string | undefined;
        if (id) cityMap.set(key, id);
        return id;
      };

      const linkRows: { user_id: string; cliente_id: string; cidade_id: string }[] = [];
      const assignments: Record<string, string> = {};
      for (const c of (clientesAtual || [])) {
        const cidadeRand = cidadesPool[Math.floor(Math.random() * cidadesPool.length)];
        const cidadeId = await ensureCityId(cidadeRand);
        if (cidadeId) {
          linkRows.push({ user_id: user.id, cliente_id: c.id, cidade_id: cidadeId });
          assignments[c.id] = cidadeRand;
        }
      }

      if (linkRows.length > 0) {
        try {
          const { error: linkErr } = await supabase
            .from("clientes_cidades")
            .insert(linkRows);
          if (linkErr) {
            console.warn("Falha ao vincular algumas cidades:", linkErr);
          }
        } catch (e) {
          console.warn("Erro ao vincular cidades:", e);
        }
      }

      // Indicar ~50% dos clientes aleatoriamente por outro cliente
      const ids = (clientesAtual || []).map(c => c.id);
      for (const c of (clientesAtual || [])) {
        const shouldIndicar = Math.random() < 0.5;
        if (!shouldIndicar) continue;
        const candidatos = ids.filter(id => id !== c.id);
        if (candidatos.length === 0) continue;
        const indicadoPor = candidatos[Math.floor(Math.random() * candidatos.length)];
        // Tentar persistir no banco; se coluna não existir, usar fallback local
        try {
          const { error: updErr } = await supabase
            .from("clientes")
            .update({ indicado_por: indicadoPor as any })
            .eq("id", c.id);
          if (updErr) {
            setReferral(c.id, indicadoPor);
          } else {
            setClientes(prev => prev.map(cli => cli.id === c.id ? { ...cli, indicado_por: indicadoPor } : cli));
          }
        } catch {
          setReferral(c.id, indicadoPor);
        }
      }

      // Atualizar estado local das cidades (usando assignments)
      setClientes(prev => prev.map(cli => {
        const nomeCidade = assignments[cli.id];
        if (!nomeCidade) return cli;
        const nextCidades = Array.from(new Set([...(cli.cidades || []), nomeCidade]));
        return { ...cli, cidades: nextCidades };
      }));

      toast({
        title: "Dados variados aplicados",
        description: "Cidades e indicações foram diversificadas.",
      });
    } catch (err) {
      console.error("Erro ao aplicar dados variados:", err);
      toast({ title: "Erro", description: "Não foi possível variar os dados." });
    }
  };
  // Atalho: pressionar Enter em qualquer campo salva a edição da linha/cartão
  const handleKeyDownSave = (clienteId: string) => (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(clienteId);
    }
  };
  // Variante para Select: adia o salvar para após onValueChange do Select
  const handleKeyDownSaveDefer = (clienteId: string) => (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setTimeout(() => saveEdit(clienteId), 0);
    }
  };
  const filteredClientes = clientes.filter(cliente => {
    const term = searchTerm.trim().toLowerCase();
    const passesSearch = term === "" || cliente.nome.toLowerCase().includes(term) || cliente.email.toLowerCase().includes(term) || cliente.telefone.toLowerCase().includes(term);
    if (!passesSearch) return false;

    // Cidades (multi-select): precisa ter ao menos uma correspondência
    if (filtros.cidades.length > 0) {
      const clientCities = (cliente.cidades && cliente.cidades.length > 0)
        ? cliente.cidades
        : (cliente.cidade ? [cliente.cidade] : []);
      const hasMatch = clientCities.some(cc => filtros.cidades.some(fc => (cc || "").toLowerCase() === fc.toLowerCase()));
      if (!hasMatch) return false;
    }

    // Instagram
    if (filtros.hasInstagram && !cliente.instagram) return false;

    // LTV range
    if (cliente.ltv < filtros.ltvMin) return false;
    if (filtros.ltvMax > 0 && cliente.ltv > filtros.ltvMax) return false;

    // Data de criação
    const created = new Date(cliente.created_at).getTime();
    if (filtros.dataInicio) {
      const di = new Date(filtros.dataInicio).getTime();
      if (created < di) return false;
    }
    if (filtros.dataFim) {
      const df = new Date(filtros.dataFim).getTime();
      if (created > df) return false;
    }

    // Tipo de indicação
    if (filtros.tipoIndicacao === "direto" && cliente.indicado_por) return false;
    if (filtros.tipoIndicacao === "indicado" && !cliente.indicado_por) return false;
    if (filtros.tipoIndicacao === "indica_outros") {
      const indicaAlguem = clientes.some(c => c.indicado_por === cliente.id);
      if (!indicaAlguem) return false;
    }

    // Indicado por ID específico
    if (filtros.indicadoPorId !== "todos" && filtros.indicadoPorId !== "" && cliente.indicado_por !== filtros.indicadoPorId) return false;

    // Mínimos
    if (cliente.projetos_count < filtros.projetosMin) return false;
    if (cliente.transacoes_count < filtros.transacoesMin) return false;

    return true;
  });

  // Calcular estatísticas
  const totalLTV = filteredClientes.reduce((sum, c) => sum + c.ltv, 0);
  const maxLTV = Math.max(...filteredClientes.map(c => c.ltv), 0);
  const avgLTV = filteredClientes.length > 0 ? totalLTV / filteredClientes.length : 0;

  const activeFiltersCount = (() => {
    let count = 0;
    if (filtros.cidades.length > 0) count++;
    if (filtros.hasInstagram) count++;
    if (filtros.ltvMin > 0) count++;
    if (filtros.ltvMax > 0) count++;
    if (filtros.dataInicio) count++;
    if (filtros.dataFim) count++;
    if (filtros.tipoIndicacao !== "todos") count++;
    if (filtros.indicadoPorId !== "todos" && filtros.indicadoPorId !== "") count++;
    if (filtros.projetosMin > 0) count++;
    if (filtros.transacoesMin > 0) count++;
    return count;
  })();

  // Ordenar clientes
  const sortedClientes = [...filteredClientes].sort((a, b) => {
    if (sortBy === "ltv") return b.ltv - a.ltv;
    if (sortBy === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return a.nome.localeCompare(b.nome);
  });
  const { colorTheme } = useTheme();
  if (loading) {
    return <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando...</p>
      </div>;
  }
  const accentStrongThemes = new Set(["ocean", "sunset", "forest", "purple", "rose"]);
  const cardGradientClass = accentStrongThemes.has(colorTheme)
    ? "bg-gradient-to-br from-primary/10 to-accent/5"
    : "bg-gradient-to-br from-primary/10 to-primary/5";

  return <div className="space-y-6 pb-20">
      {/* Banner Informativo */}
      <Card className="rounded-3xl border-0 bg-gradient-to-r from-blue-500/10 to-blue-600/5 shadow-lg">
        
      </Card>

      {/* Seeding removido: exibir apenas dados reais do banco */}
      
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua base de clientes e acompanhe o LTV
        </p>
      </div>



      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">LTV Total</p>
          </div>
          <p className="text-xl font-semibold">
            R$ {totalLTV.toFixed(2)}
          </p>
        </Card>

        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">LTV Médio</p>
          </div>
          <p className="text-xl font-semibold">
            R$ {avgLTV.toFixed(2)}
          </p>
        </Card>

        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Maior LTV</p>
          </div>
          <p className="text-xl font-semibold">
            R$ {maxLTV.toFixed(2)}
          </p>
        </Card>

        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Total Clientes</p>
          </div>
          <p className="text-xl font-semibold">
            {clientes.length}
          </p>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)} className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList className="inline-flex w-auto rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
            <TabsTrigger value="table" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50">
              <Table2 className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Tabela</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50">
              <Network className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Rede</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50">
              <LayoutList className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50">
              <LayoutGrid className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Grid</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Barra de filtros compacta e sutil - posicionada após as abas */}
        {viewMode !== 'network' && (
        <div className="flex items-center justify-between gap-4 py-3 px-1 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar clientes..." className="pl-10 rounded-lg border-muted/50 bg-background/50 backdrop-blur-sm h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Filtros Avançados */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-lg h-9">
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0.5 text-xs">{activeFiltersCount}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[520px] rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cidades</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {filtros.cidades.map((nome) => (
                        <Badge key={nome} variant="secondary" className="rounded-full px-2 py-1 text-xs">
                          <span>{nome}</span>
                          <button
                            type="button"
                            onClick={() => setFiltros({ ...filtros, cidades: filtros.cidades.filter(c => c.toLowerCase() !== nome.toLowerCase()) })}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            aria-label={`Remover ${nome}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Digite e pressione Enter para adicionar"
                      value={filterCityQuery}
                      onChange={e => setFilterCityQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const nome = filterCityQuery.trim();
                          if (!nome) return;
                          if (!filtros.cidades.some(c => c.toLowerCase() === nome.toLowerCase())) {
                            setFiltros({ ...filtros, cidades: [...filtros.cidades, nome] });
                          }
                          setFilterCityQuery("");
                        }
                      }}
                    />
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Ranking:</span>
                      <Button type="button" variant={cityRankingMode === "mais_usadas" ? "secondary" : "ghost"} size="sm" className="h-6 rounded-full px-2"
                        onClick={() => setCityRankingMode("mais_usadas")}>Mais usadas</Button>
                      <Button type="button" variant={cityRankingMode === "mais_recentes" ? "secondary" : "ghost"} size="sm" className="h-6 rounded-full px-2"
                        onClick={() => setCityRankingMode("mais_recentes")}>Mais recentes</Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getRankedCities(filtros.cidades, filterCityQuery).map(c => (
                        <Button key={c.id || c.nome} type="button" variant="outline" size="sm" className="rounded-full h-7"
                          onClick={() => {
                            if (!filtros.cidades.some(p => p.toLowerCase() === c.nome.toLowerCase())) {
                              setFiltros({ ...filtros, cidades: [...filtros.cidades, c.nome] });
                            }
                            setFilterCityQuery("");
                          }}
                        >
                          {c.nome}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={filtros.hasInstagram} onCheckedChange={v => setFiltros({ ...filtros, hasInstagram: Boolean(v) })} />
                      <span className="text-sm text-muted-foreground">Somente quem tem link</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>LTV mínimo</Label>
                    <Input type="number" min={0} value={filtros.ltvMin} onChange={e => setFiltros({ ...filtros, ltvMin: Number(e.target.value || 0) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>LTV máximo</Label>
                    <Input type="number" min={0} placeholder="Sem limite" value={filtros.ltvMax || ""} onChange={e => setFiltros({ ...filtros, ltvMax: Number(e.target.value || 0) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data início</Label>
                    <Input type="date" value={filtros.dataInicio} onChange={e => setFiltros({ ...filtros, dataInicio: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data fim</Label>
                    <Input type="date" value={filtros.dataFim} onChange={e => setFiltros({ ...filtros, dataFim: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de indicação</Label>
                    <Select value={filtros.tipoIndicacao} onValueChange={v => setFiltros({ ...filtros, tipoIndicacao: v as any })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="direto">Cliente direto</SelectItem>
                        <SelectItem value="indicado">Indicado por alguém</SelectItem>
                        <SelectItem value="indica_outros">Já indicou outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Indicado por</Label>
                    <Select value={filtros.indicadoPorId} onValueChange={v => setFiltros({ ...filtros, indicadoPorId: v })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[220px]">
                        <SelectItem value="todos">Todos</SelectItem>
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Projetos mínimos</Label>
                    <Input type="number" min={0} value={filtros.projetosMin} onChange={e => setFiltros({ ...filtros, projetosMin: Number(e.target.value || 0) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Transações mínimas</Label>
                    <Input type="number" min={0} value={filtros.transacoesMin} onChange={e => setFiltros({ ...filtros, transacoesMin: Number(e.target.value || 0) })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" className="rounded-xl" onClick={() => setFiltros({
                    cidades: [],
                    hasInstagram: false,
                    ltvMin: 0,
                    ltvMax: 0,
                    dataInicio: "",
                    dataFim: "",
                    tipoIndicacao: "todos",
                    indicadoPorId: "todos",
                    projetosMin: 0,
                    transacoesMin: 0
                  })}>Limpar</Button>
                  {/* limpar query local */}
                  {filterCityQuery && <Button variant="ghost" className="rounded-xl" onClick={() => setFilterCityQuery("")}>Limpar texto</Button>}
                  <Button className="rounded-xl" onClick={() => { /* Popover fecha ao clicar fora; sem ação extra */ }}>Aplicar</Button>
                </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-lg h-9" title="Mostrar/ocultar colunas">
                <EyeOff className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="rounded-xl w-56">
              <div className="space-y-1">
                {(Object.keys(colLabels) as ColKey[]).map((key) => (
                  <div key={key} className="flex items-center gap-2 py-1">
                    <Checkbox id={`col-${key}`} checked={visibleCols[key]} onCheckedChange={() => toggleCol(key)} />
                    <label htmlFor={`col-${key}`} className="text-sm">{colLabels[key]}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-lg gap-2 h-9 px-3">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Novo Cliente</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl">
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" className="rounded-xl" value={formData.nome} onChange={e => setFormData({
                    ...formData,
                    nome: e.target.value
                  })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" className="rounded-xl" value={formData.email} onChange={e => setFormData({
                    ...formData,
                    email: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" className="rounded-xl" value={formData.telefone} onChange={e => setFormData({
                    ...formData,
                    telefone: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram (link)</Label>
                    <Input id="instagram" placeholder="https://instagram.com/usuario" className="rounded-xl" value={formData.instagram} onChange={e => setFormData({
                    ...formData,
                    instagram: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidades</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedCities.map((c) => (
                        <Badge key={c.nome} variant="secondary" className="rounded-full px-2 py-1 text-xs">
                          <span>{c.nome}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedCities(prev => prev.filter(x => x.nome !== c.nome))}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            aria-label={`Remover ${c.nome}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Digite e pressione Enter para adicionar"
                      className="rounded-xl"
                      value={cityQuery}
                      onChange={e => setCityQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const nome = cityQuery.trim();
                          if (!nome) return;
                          const existing = availableCities.find(c => c.nome.toLowerCase() === nome.toLowerCase());
                          setSelectedCities(prev => {
                            if (prev.some(p => p.nome.toLowerCase() === nome.toLowerCase())) return prev;
                            return [...prev, existing ? { id: existing.id, nome: existing.nome } : { nome }];
                          });
                          setCityQuery("");
                        }
                      }}
                    />
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Ranking:</span>
                      <Button type="button" variant={cityRankingMode === "mais_usadas" ? "secondary" : "ghost"} size="sm" className="h-6 rounded-full px-2"
                        onClick={() => setCityRankingMode("mais_usadas")}>Mais usadas</Button>
                      <Button type="button" variant={cityRankingMode === "mais_recentes" ? "secondary" : "ghost"} size="sm" className="h-6 rounded-full px-2"
                        onClick={() => setCityRankingMode("mais_recentes")}>Mais recentes</Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getRankedCities(selectedCities.map(s => s.nome), cityQuery).map(c => (
                        <Button key={c.id || c.nome} type="button" variant="outline" size="sm" className="rounded-full h-7"
                          onClick={() => {
                            setSelectedCities(prev => prev.some(p => p.nome.toLowerCase() === c.nome.toLowerCase()) ? prev : [...prev, { id: c.id, nome: c.nome }]);
                            setCityQuery("");
                          }}
                        >
                          {c.nome}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="indicado_por">Indicado por (opcional)</Label>
                    <Select value={formData.indicado_por} onValueChange={value => setFormData({
                    ...formData,
                    indicado_por: value
                  })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o cliente que indicou" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">Nenhum (cliente direto)</SelectItem>
                        {clientes.map(cliente => <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full rounded-xl">
                    Salvar Cliente
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              <Button variant={sortBy === "ltv" ? "default" : "ghost"} size="sm" className="rounded-md h-7 px-2 text-xs" onClick={() => setSortBy("ltv")}>
                LTV
              </Button>
              <Button variant={sortBy === "nome" ? "default" : "ghost"} size="sm" className="rounded-md h-7 px-2 text-xs" onClick={() => setSortBy("nome")}>
                Nome
              </Button>
              <Button variant={sortBy === "created_at" ? "default" : "ghost"} size="sm" className="rounded-md h-7 px-2 text-xs" onClick={() => setSortBy("created_at")}>
                Data
              </Button>
            </div>
            
            <Badge variant="outline" className="rounded-md text-xs px-2 py-1 bg-background/50">
              {filteredClientes.length}
            </Badge>
          </div>
        </div>
        )}



        {/* Visualização em Lista (Cards) */}
        <TabsContent value="cards" className="mt-6 animate-in fade-in-50 duration-300">
          {sortedClientes.length === 0 ? <Card className="p-12 rounded-xl">
              <div className="text-center text-muted-foreground">
                <p>Nenhum cliente encontrado.</p>
                <p className="text-sm mt-1">Clique em "Novo Cliente" para começar.</p>
              </div>
            </Card> : <div className="space-y-4">
              {sortedClientes.map(cliente => {
                const isEditing = editingRows.has(cliente.id);
                const editData = editedData[cliente.id] || cliente;
                const strongAccentThemes = ["ocean", "sunset", "forest", "purple", "rose"] as const;
                const isStrongAccent = strongAccentThemes.includes(colorTheme as any);
                const hoverClass = isStrongAccent ? "hover:bg-muted/20" : "hover:bg-muted/30";
                return (
                  <Card
                    key={cliente.id}
                    className={`p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer ${hoverClass} transition-colors`}
                    onDoubleClick={() => startEditing(cliente.id, cliente)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-3 flex-wrap">
                          <div className="flex-1 min-w-[220px]">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input value={editData.nome || ""} onChange={e => updateEditedData(cliente.id, 'nome', e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-9" />
                                <Input type="email" value={editData.email || ""} onChange={e => updateEditedData(cliente.id, 'email', e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-9" />
                                <Input value={editData.telefone || ""} onChange={e => updateEditedData(cliente.id, 'telefone', e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-9" />
                                <Input value={(editData as any).instagram || ""} onChange={e => updateEditedData(cliente.id, 'instagram' as any, e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-9" placeholder="Instagram (link)" />
                                <Input value={(editData as any).cidade || ""} onChange={e => updateEditedData(cliente.id, 'cidade' as any, e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-9" placeholder="Cidade" />
                              </div>
                            ) : (
                              <>
                                <h3 className="font-semibold text-lg">{cliente.nome}</h3>
                                <p className="text-sm text-muted-foreground">{cliente.email}</p>
                                <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={`rounded-full text-xs ${getLTVColor(cliente.ltv, maxLTV)}`}>
                              {getLTVLabel(cliente.ltv)}
                            </Badge>
                            <span className="text-sm font-semibold text-success">R$ {cliente.ltv.toFixed(2)}</span>
                          </div>
                        </div>

                        {!isEditing && (
                          <div className="space-y-2">
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{cliente.projetos_count} projeto(s)</span>
                              <span>•</span>
                              <span>{cliente.transacoes_count} transação(ões)</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-success" onClick={() => saveEdit(cliente.id)} title="Salvar">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => cancelEditing(cliente.id)} title="Cancelar">
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => navigate(`/projetos?cliente=${cliente.id}`)}>
                              <FolderOpen className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive" onClick={() => handleDelete(cliente.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
                  })}
            </div>}
        </TabsContent>

        {/* Visualização em Grid */}
        <TabsContent value="grid" className="mt-6 animate-in fade-in-50 duration-300">
          {sortedClientes.length === 0 ? <Card className="p-12 rounded-xl">
              <div className="text-center text-muted-foreground">
                <p>Nenhum cliente encontrado.</p>
                <p className="text-sm mt-1">Clique em "Novo Cliente" para começar.</p>
              </div>
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedClientes.map(cliente => <Card key={cliente.id} className="rounded-xl hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1">{cliente.nome}</h3>
                        <Badge variant="outline" className={`rounded-full text-xs ${getLTVColor(cliente.ltv, maxLTV)}`}>
                          {getLTVLabel(cliente.ltv)}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive" onClick={() => handleDelete(cliente.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium min-w-[60px]">Email:</span>
                        <span className="text-muted-foreground truncate">{cliente.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium min-w-[60px]">Telefone:</span>
                        <span className="text-muted-foreground">{cliente.telefone}</span>
                      </div>
                    </div>

                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">LTV</span>
                          <span className="font-semibold text-primary">R$ {cliente.ltv.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{cliente.projetos_count} projeto(s)</span>
                          <span>•</span>
                          <span>{cliente.transacoes_count} transação(ões)</span>
                        </div>
                      </div>

                    <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => navigate(`/projetos?cliente=${cliente.id}`)}>
                      <FolderOpen className="w-4 h-4" />
                      Ver Projetos
                    </Button>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>

        {/* Visualização em Tabela com Edição Inline */}
        <TabsContent value="table" className="mt-6 animate-in fade-in-50 duration-300">
          <div className="space-y-4">

                {/* Formulário de Criação - Aparece com animação */}
                 {isTableFormOpen && <Card className="p-6 rounded-xl animate-fade-in">
                     <h3 className="font-semibold text-lg mb-4">Novo Cliente</h3>
                     <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div className="space-y-2">
                       <Label htmlFor="table-nome">Nome</Label>
                       <Input id="table-nome" className="rounded-xl" value={formData.nome} onChange={e => setFormData({
                  ...formData,
                  nome: e.target.value
                })} required />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="table-email">Email</Label>
                         <Input id="table-email" type="email" className="rounded-xl" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="table-telefone">Telefone</Label>
                         <Input id="table-telefone" className="rounded-xl" value={formData.telefone} onChange={e => setFormData({
                  ...formData,
                  telefone: e.target.value
                })} />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="table-instagram">Instagram</Label>
                         <Input id="table-instagram" placeholder="https://instagram.com/usuario" className="rounded-xl" value={formData.instagram} onChange={e => setFormData({
                 ...formData,
                 instagram: e.target.value
               })} />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="table-cidade">Cidade</Label>
                         <Input id="table-cidade" className="rounded-xl" value={formData.cidade} onChange={e => setFormData({
                 ...formData,
                 cidade: e.target.value
               })} />
                       </div>
                       <div className="flex items-end">
                         <Button type="submit" className="w-full rounded-xl gap-2">
                           <Plus className="w-4 h-4" />
                           Salvar
                         </Button>
                       </div>
                     </form>
                   </Card>}

                 {editingRows.size > 0 && <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
                     <p className="text-sm flex-1">
                       {editingRows.size} linha(s) em edição
                     </p>
                     <Button size="sm" className="rounded-xl gap-2" onClick={saveAllEdits}>
                       <Save className="w-4 h-4" />
                       Salvar Todas
                     </Button>
                   </div>}

                 {sortedClientes.length === 0 ? <Card className="p-12 rounded-xl">
                     <div className="text-center text-muted-foreground">
                       <p>Nenhum cliente encontrado.</p>
                       <p className="text-sm mt-1">Clique em "Adicionar Cliente" para começar.</p>
                     </div>
                  </Card> : <Card className="rounded-xl overflow-hidden relative" ref={tableContainerRef}>
                     <div className="overflow-x-auto scroll-smooth" ref={tableScrollRef}>
                       <div className="min-w-[1600px]">
                         <Table>
                         <TableHeader>
                           <TableRow>
                             {visibleCols.nome && <TableHead className="min-w-[200px]">Nome</TableHead>}
                             {visibleCols.email && <TableHead className="min-w-[250px]">Email</TableHead>}
                             {visibleCols.telefone && <TableHead className="min-w-[150px]">Telefone</TableHead>}
                             {visibleCols.instagram && <TableHead className="min-w-[200px]">Instagram</TableHead>}
                             {visibleCols.cidade && <TableHead className="min-w-[150px]">Cidade</TableHead>}
                             {visibleCols.ltv && <TableHead className="min-w-[150px]">LTV</TableHead>}
                             {visibleCols.categoria && <TableHead className="min-w-[120px]">Categoria</TableHead>}
                             {visibleCols.indicado_por && <TableHead className="min-w-[180px]">Indicado por</TableHead>}
                             {visibleCols.indicados && <TableHead className="min-w-[200px]">Indicados</TableHead>}
                             {visibleCols.projetos && <TableHead className="min-w-[120px]">Projetos</TableHead>}
                             {visibleCols.acoes && <TableHead className="text-right min-w-[190px] sticky right-0 bg-background z-10">Ações</TableHead>}
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {sortedClientes.map(cliente => {
                    const isEditing = editingRows.has(cliente.id);
                    const editData = editedData[cliente.id] || cliente;
                    return <TableRow
                              key={cliente.id}
                              className={(isEditing ? "bg-muted/50 " : "") + `cursor-pointer ${(["ocean","sunset","forest","purple","rose"] as const).includes(colorTheme as any) ? "hover:bg-muted/20" : "hover:bg-muted/30"} transition-colors`}
                              onDoubleClick={() => startEditing(cliente.id, cliente)}
                            >
                                 {visibleCols.nome && <TableCell>
                                   {isEditing ? <Input value={editData.nome} onChange={e => updateEditedData(cliente.id, 'nome', e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-8" /> : <span className="font-medium">{cliente.nome}</span>}
                                 </TableCell>}
                                 {visibleCols.email && <TableCell>
                                   {isEditing ? <Input type="email" value={editData.email} onChange={e => updateEditedData(cliente.id, 'email', e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-8" /> : <span className="text-muted-foreground">{cliente.email}</span>}
                                 </TableCell>}
                                 {visibleCols.telefone && <TableCell>
                                   {isEditing ? <Input value={editData.telefone} onChange={e => updateEditedData(cliente.id, 'telefone', e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-8" /> : <span className="text-muted-foreground">{cliente.telefone}</span>}
                                 </TableCell>}
                                 {visibleCols.instagram && <TableCell>
                                   {isEditing ? <Input value={(editData as any).instagram || ''} onChange={e => updateEditedData(cliente.id, 'instagram' as any, e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-8" /> : cliente.instagram ? <a href={cliente.instagram} target="_blank" rel="noreferrer" className="text-primary underline text-sm">{cliente.instagram}</a> : <span className="text-xs text-muted-foreground italic">Não informado</span>}
                                 </TableCell>}
                                 {visibleCols.cidade && <TableCell>
                                  {isEditing ? <Input value={(editData as any).cidade || ''} onChange={e => updateEditedData(cliente.id, 'cidade' as any, e.target.value)} onKeyDown={handleKeyDownSave(cliente.id)} className="rounded-xl h-8" /> : ((cliente as any).cidades && (cliente as any).cidades.length > 0) ? <span className="text-muted-foreground">{(cliente as any).cidades.join(', ')}</span> : cliente.cidade ? <span className="text-muted-foreground">{cliente.cidade}</span> : <span className="text-xs text-muted-foreground italic">Não informado</span>}
                                 </TableCell>}
                                  {visibleCols.ltv && <TableCell>
                                    <div className="space-y-1">
                                      <span className="font-semibold text-success">
                                        R$ {cliente.ltv.toFixed(2)}
                                      </span>
                                    </div>
                                  </TableCell>}
                                 {visibleCols.categoria && <TableCell>
                                   <Badge variant="outline" className={`rounded-full text-xs ${getLTVColor(cliente.ltv, maxLTV)}`}>
                                     {getLTVLabel(cliente.ltv)}
                                   </Badge>
                                 </TableCell>}
                                 {visibleCols.indicado_por && <TableCell>
                                   {isEditing ? <Select value={editData.indicado_por || "none"} onValueChange={value => updateEditedData(cliente.id, 'indicado_por', value === "none" ? "" : value)}>
                                       <SelectTrigger className="rounded-xl h-8 text-xs" onKeyDown={handleKeyDownSaveDefer(cliente.id)}>
                                         <SelectValue placeholder="Selecionar indicador" />
                                       </SelectTrigger>
                                       <SelectContent className="rounded-xl" onKeyDown={handleKeyDownSaveDefer(cliente.id)}>
                                         <SelectItem value="none">Nenhum (cliente direto)</SelectItem>
                                         {clientes.filter(c => c.id !== cliente.id) // Não pode indicar a si mesmo
                                            .map(c => <SelectItem key={c.id} value={c.id}>
                                               {c.nome}
                                             </SelectItem>)}
                                       </SelectContent>
                                     </Select> : cliente.indicado_por ? <div className="flex items-center gap-2">
                                         <Badge variant="secondary" className="rounded-full text-xs">
                                           {clientes.find(c => c.id === cliente.indicado_por)?.nome || 'Cliente não encontrado'}
                                         </Badge>
                                       </div> : <span className="text-xs text-muted-foreground italic">Cliente direto</span>}
                                 </TableCell>}
                                 {visibleCols.indicados && <TableCell>
                                   {/* Quem este cliente já indicou */}
                                   {(() => {
                                     const indicados = clientes.filter(c => c.indicado_por === cliente.id);
                                     if (indicados.length === 0) return <span className="text-xs text-muted-foreground italic">Nenhum</span>;
                                     const nomes = indicados.map(i => i.nome).join(', ');
                                     return <span className="text-sm" title={nomes}>{indicados.length} cliente(s)</span>;
                                   })()}
                                 </TableCell>}
                                 {visibleCols.projetos && <TableCell>
                                   <div className="text-sm text-muted-foreground">
                                     <div>{cliente.projetos_count} projeto(s)</div>
                                     <div className="text-xs">{cliente.transacoes_count} transação(ões)</div>
                                   </div>
                                 </TableCell>}
                               {visibleCols.acoes && <TableCell className="text-right sticky right-0 bg-background z-10 min-w-[190px]">
                                  <div className="flex gap-1 justify-end relative z-20">
                                    {isEditing ? <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-success hover:bg-success/10" onClick={() => saveEdit(cliente.id)} title="Salvar">
                                          <Check className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/40" onClick={() => cancelEditing(cliente.id)} title="Cancelar">
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </> : <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/40 hover:text-foreground" onClick={() => navigate(`/projetos?cliente=${cliente.id}`)} title="Ver projetos">
                                          <FolderOpen className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/40 hover:text-foreground" onClick={() => navigate(`/clientes/${cliente.id}`)} title="Ver perfil">
                                          <User className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/40 hover:text-foreground" onClick={() => startEditing(cliente.id, cliente)} title="Editar">
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cliente.id)} title="Deletar">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </>}
                                  </div>
                                </TableCell>}
                              </TableRow>;
                  })}
                         </TableBody>
                         </Table>
                       </div>
                     </div>
                     {/* Setas transparentes para navegação horizontal (overlay fixo) */}
                   </Card>}
                </div>
        </TabsContent>
        {/* Overlay de setas visível apenas na visualização de tabela */}
        {viewMode === 'table' && isTableVisible50 && (
          <>
            {showLeftArrow && (
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/40 shadow-lg backdrop-blur-md"
                onClick={() => tableScrollRef.current?.scrollBy({ left: -480, behavior: 'smooth' })}
                title="Rolar para a esquerda"
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            {showRightArrow && (
              <Button
                variant="ghost"
                size="icon"
                className="fixed right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/40 shadow-lg backdrop-blur-md"
                onClick={() => tableScrollRef.current?.scrollBy({ left: 480, behavior: 'smooth' })}
                title="Rolar para a direita"
                aria-label="Rolar para a direita"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </>
        )}

        {/* Visualização em Rede */}
        <TabsContent value="network" className="mt-6 animate-in fade-in-50 duration-300">
          <ReferralNetwork clientes={clientes} />
        </TabsContent>
      </Tabs>
    </div>;
};
export default Clientes;
