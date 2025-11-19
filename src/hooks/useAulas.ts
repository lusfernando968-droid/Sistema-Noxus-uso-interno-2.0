import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type AulaStatus = "esboco" | "desenvolvimento" | "revisao" | "finalizacao" | "pronta";

export interface Aula {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: AulaStatus;
  disciplina?: string | null;
  responsavel_id?: string | null;
  prazo?: string | null;
  modelo_id?: string | null;
  estrutura?: any | null;
  created_at?: string;
  updated_at?: string;
}

export interface AulaModelo {
  id: string;
  titulo: string;
  disciplina?: string | null;
  descricao?: string | null;
  estrutura?: any | null;
  created_at?: string;
  updated_at?: string;
}

export function useAulaModelos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [modelos, setModelos] = useState<AulaModelo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("aula_modelos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar modelos", description: error.message });
      } else {
        setModelos((data || []) as AulaModelo[]);
      }
      setLoading(false);
    })();
  }, [user]);

  return { modelos, loading };
}

export function useAulas() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AulaStatus | "all">("all");
  const [disciplinaFilter, setDisciplinaFilter] = useState<string | "all">("all");
  const [responsavelFilter, setResponsavelFilter] = useState<string | "all">("all");

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("aulas")
        .select("*")
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar aulas", description: error.message });
      } else {
        setAulas((data || []) as Aula[]);
      }
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    return aulas.filter((a) => {
      const s = search.toLowerCase();
      const matchSearch = !s || a.titulo?.toLowerCase().includes(s) || a.descricao?.toLowerCase().includes(s) || a.disciplina?.toLowerCase().includes(s);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchDisciplina = disciplinaFilter === "all" || a.disciplina === disciplinaFilter;
      const matchResp = responsavelFilter === "all" || a.responsavel_id === responsavelFilter;
      return matchSearch && matchStatus && matchDisciplina && matchResp;
    });
  }, [aulas, search, statusFilter, disciplinaFilter, responsavelFilter]);

  async function updateStatus(id: string, novoStatus: AulaStatus) {
    const prev = aulas;
    setAulas((list) => list.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)));
    const { error } = await supabase.from("aulas").update({ status: novoStatus }).eq("id", id);
    if (error) {
      toast({ title: "Falha ao mover aula", description: error.message });
      setAulas(prev);
      return;
    }
    await supabase.from("aula_versions").insert({ aula_id: id, user_id: user!.id, version_number: Date.now(), snapshot: { status: novoStatus } });
  }

  async function updateAula(id: string, patch: Partial<Aula>) {
    const prev = aulas;
    setAulas((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    const { error } = await supabase.from("aulas").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Falha ao salvar aula", description: error.message });
      setAulas(prev);
      return false;
    }
    await supabase.from("aula_versions").insert({ aula_id: id, user_id: user!.id, version_number: Date.now(), snapshot: { ...patch } });
    return true;
  }

  async function createAulaFromModelo(modeloId: string, overrides: Partial<Aula> = {}) {
    if (!user) {
      toast({ title: "Sessão não encontrada", description: "Faça login para criar aulas", variant: "destructive" });
      return null;
    }
    const { data: modelo } = await supabase.from("aula_modelos").select("*").eq("id", modeloId).maybeSingle();
    const payload = {
      titulo: modelo?.titulo || "Nova Aula",
      disciplina: modelo?.disciplina || null,
      descricao: modelo?.descricao || null,
      status: "esboco" as AulaStatus,
      modelo_id: modeloId,
      responsavel_id: user.id,
      estrutura: modelo?.estrutura || null,
      ...overrides,
    };
    const { data, error } = await supabase.from("aulas").insert(payload).select("*").single();
    if (error) {
      toast({ title: "Falha ao criar aula", description: error.message });
      return null;
    }
    setAulas((list) => [data as Aula, ...list]);
    try {
      await supabase.from("aula_versions").insert({ aula_id: (data as Aula).id, user_id: user.id, version_number: 1, snapshot: payload });
    } catch (e: any) {
      toast({ title: "Versão não registrada", description: e?.message || "Erro ao salvar versão", variant: "destructive" });
    }
    toast({ title: "Aula criada", description: "A aula foi adicionada" });
    return data as Aula;
  }

  async function createDefaultModelos() {
    const modelosPadrao = [
      {
        titulo: 'Aula de Matemática Básica',
        disciplina: 'Matemática',
        descricao: 'Modelo para aulas de matemática básica',
        estrutura: [
          { tipo: 'introducao', titulo: 'Introdução', duracao: 10 },
          { tipo: 'conteudo', titulo: 'Explicação do Conceito', duracao: 25 },
          { tipo: 'exercicios', titulo: 'Exercícios Práticos', duracao: 15 },
          { tipo: 'conclusao', titulo: 'Conclusão e Tarefa', duracao: 10 }
        ]
      },
      {
        titulo: 'Aula de Português - Gramática',
        disciplina: 'Português',
        descricao: 'Modelo para aulas de gramática',
        estrutura: [
          { tipo: 'revisao', titulo: 'Revisão da Aula Anterior', duracao: 5 },
          { tipo: 'novo_conteudo', titulo: 'Novo Conteúdo', duracao: 20 },
          { tipo: 'pratica', titulo: 'Prática em Grupo', duracao: 15 },
          { tipo: 'tarefa', titulo: 'Tarefa de Casa', duracao: 5 }
        ]
      },
      {
        titulo: 'Aula de Ciências - Experimentos',
        disciplina: 'Ciências',
        descricao: 'Modelo para aulas com experimentos',
        estrutura: [
          { tipo: 'hipotese', titulo: 'Apresentação da Hipótese', duracao: 10 },
          { tipo: 'experimento', titulo: 'Experimento Prático', duracao: 30 },
          { tipo: 'registro', titulo: 'Registro dos Resultados', duracao: 10 },
          { tipo: 'analise', titulo: 'Análise e Conclusão', duracao: 10 }
        ]
      },
      {
        titulo: 'Aula de História - Debate',
        disciplina: 'História',
        descricao: 'Modelo para aulas com debate',
        estrutura: [
          { tipo: 'contexto', titulo: 'Contextualização Histórica', duracao: 15 },
          { tipo: 'debate', titulo: 'Debate em Grupos', duracao: 25 },
          { tipo: 'sintese', titulo: 'Síntese dos Argumentos', duracao: 10 },
          { tipo: 'reflexao', titulo: 'Reflexão Final', duracao: 10 }
        ]
      },
      {
        titulo: 'Aula de Geografia - Mapas',
        disciplina: 'Geografia',
        descricao: 'Modelo para aulas com análise de mapas',
        estrutura: [
          { tipo: 'mapa', titulo: 'Análise do Mapa', duracao: 15 },
          { tipo: 'interpretacao', titulo: 'Interpretação dos Dados', duracao: 20 },
          { tipo: 'discussao', titulo: 'Discussão em Grupo', duracao: 10 },
          { tipo: 'aplicacao', titulo: 'Aplicação Prática', duracao: 15 }
        ]
      }
    ];

    try {
      const { error } = await supabase
        .from('aula_modelos')
        .insert(modelosPadrao);

      if (error) {
        console.error('Erro ao criar modelos padrão:', error);
        throw error;
      }

      console.log('Modelos padrão criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar modelos padrão:', error);
      throw error;
    }
  }

  async function createAula(overrides: Partial<Aula> = {}) {
    if (!user) {
      toast({ title: "Sessão não encontrada", description: "Faça login para criar aulas", variant: "destructive" });
      return null;
    }
    const prev = aulas;
    const payload = {
      titulo: overrides.titulo || "Nova Aula",
      descricao: overrides.descricao ?? null,
      status: (overrides.status as AulaStatus) || "esboco",
      disciplina: overrides.disciplina ?? null,
      responsavel_id: overrides.responsavel_id ?? user.id,
      prazo: overrides.prazo ?? null,
      modelo_id: overrides.modelo_id ?? null,
      estrutura: overrides.estrutura ?? null,
    } as Partial<Aula> & { titulo: string; status: AulaStatus };
    const tempId = `temp-${Date.now()}`;
    const tempAula: Aula = {
      id: tempId,
      titulo: payload.titulo,
      descricao: payload.descricao || null,
      status: payload.status,
      disciplina: payload.disciplina || null,
      responsavel_id: payload.responsavel_id || null,
      prazo: payload.prazo || null,
      modelo_id: payload.modelo_id || null,
      estrutura: payload.estrutura || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAulas((list) => [tempAula, ...list]);
    const { data, error } = await supabase.from("aulas").insert(payload).select("*").single();
    if (error) {
      setAulas(prev);
      toast({ title: "Falha ao criar aula", description: error.message });
      return null;
    }
    setAulas((list) => list.map((a) => (a.id === tempId ? (data as Aula) : a)));
    (async () => {
      const { error: versionError } = await supabase
        .from("aula_versions")
        .insert({ aula_id: (data as Aula).id, user_id: user.id, version_number: 1, snapshot: payload });
      if (versionError) {
        toast({ title: "Versão não registrada", description: versionError.message, variant: "destructive" });
      }
    })();
    toast({ title: "Aula criada", description: "A aula foi adicionada" });
    return data as Aula;
  }

  async function deleteAula(id: string) {
    if (!user) {
      toast({ title: "Sessão não encontrada", description: "Faça login para excluir aulas", variant: "destructive" });
      return false;
    }
    const prev = aulas;
    setAulas((list) => list.filter((a) => a.id !== id));
    const { error } = await supabase.from("aulas").delete().eq("id", id);
    if (error) {
      toast({ title: "Falha ao excluir aula", description: error.message, variant: "destructive" });
      setAulas(prev);
      return false;
    }
    toast({ title: "Aula excluída", description: "A aula foi removida" });
    return true;
  }

  return {
    aulas,
    filtered,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    disciplinaFilter,
    setDisciplinaFilter,
    responsavelFilter,
    setResponsavelFilter,
    updateStatus,
    updateAula,
    createAulaFromModelo,
    createAula,
    deleteAula,
  };
}
