import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  Link as LinkIcon,
  ExternalLink,
  Trash2,
  Upload,
  FileText,
  Download,
  Loader2,
  Type,
  User,
  Activity,
  Calendar,
  DollarSign,
  Layers,
  Target,
  Briefcase
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Cliente {
  id: string;
  nome: string;
}

interface ProjectBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId?: string;
  clientes: Cliente[];
  onSuccess: () => void;
}

interface Referencia {
  id: string;
  titulo: string;
  url: string;
  descricao?: string;
}

interface Anexo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
}

// Utilitários auxiliares
const formatCurrencyBR = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return "";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

const parseDateOnly = (dateStr: string) => {
  if (!dateStr) return undefined;
  return new Date(dateStr + "T12:00:00");
};

export function ProjectBuilder({ open, onOpenChange, projetoId, clientes, onSuccess }: ProjectBuilderProps) {
  const { toast } = useToast();
  const { user, masterId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Estados do Formulário
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [notas, setNotas] = useState("");
  const [status, setStatus] = useState("planejamento");
  const [categoria, setCategoria] = useState("tatuagem");
  const [capaUrl, setCapaUrl] = useState<string>("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [driveLink, setDriveLink] = useState("");

  const [valorPorSessao, setValorPorSessao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [quantidadeSessoes, setQuantidadeSessoes] = useState("");

  // Referências
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [novaRefTitulo, setNovaRefTitulo] = useState("");
  const [novaRefUrl, setNovaRefUrl] = useState("");
  const [novaRefDescricao, setNovaRefDescricao] = useState("");

  // Anexos
  const [anexos, setAnexos] = useState<Anexo[]>([]);

  // Cálculo automático do valor total
  useEffect(() => {
    const vSessao = parseFloat(valorPorSessao);
    const qtd = parseInt(quantidadeSessoes);

    if (!isNaN(vSessao) && !isNaN(qtd) && vSessao >= 0 && qtd > 0) {
      const total = vSessao * qtd;
      setValorTotal(total.toString());
    }
  }, [valorPorSessao, quantidadeSessoes]);

  // Resetar formulário ao abrir/fechar ou mudar projetoId
  useEffect(() => {
    if (open) {
      if (projetoId) {
        loadProjeto(projetoId);
      } else {
        resetForm();
      }
    }
  }, [open, projetoId]);

  const resetForm = () => {
    setTitulo("");
    setClienteId("");
    setDescricao("");
    setNotas("");
    setStatus("planejamento");
    setCategoria("tatuagem");
    setCapaUrl("");
    setDataInicio("");
    setDataFim("");
    setDriveLink("");
    setValorPorSessao("");
    setValorTotal("");
    setQuantidadeSessoes("");
    setReferencias([]);
    setAnexos([]);
    setNovaRefTitulo("");
    setNovaRefUrl("");
    setNovaRefDescricao("");
  };

  const loadProjeto = async (id: string) => {
    setLoading(true);
    try {
      if (!masterId) return;

      const [projetoRes, referenciasRes, anexosRes] = await Promise.all([
        supabase
          .from("projetos")
          .select("*")
          .eq("id", id)
          .single(),
        supabase
          .from("projeto_referencias")
          .select("*")
          .eq("projeto_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("projeto_anexos")
          .select("*")
          .eq("projeto_id", id)
          .order("created_at", { ascending: false })
      ]);

      if (projetoRes.error) throw projetoRes.error;

      const projeto = projetoRes.data;
      if (projeto) {
        setTitulo(projeto.titulo);
        setClienteId(projeto.cliente_id);
        setDescricao(projeto.descricao || "");
        setNotas(projeto.notas || "");
        setStatus(projeto.status);
        setCategoria(projeto.categoria || "tatuagem");
        setCapaUrl(projeto.capa_url || "");
        setDataInicio(projeto.data_inicio || "");
        setDataFim(projeto.data_fim || "");
        setDriveLink(projeto.drive_link || "");
        setValorPorSessao(projeto.valor_por_sessao ? String(projeto.valor_por_sessao) : "");
        setValorTotal(projeto.valor_total ? String(projeto.valor_total) : "");
        setQuantidadeSessoes(projeto.quantidade_sessoes ? String(projeto.quantidade_sessoes) : "");
      }

      if (referenciasRes.data) setReferencias(referenciasRes.data);
      if (anexosRes.data) setAnexos(anexosRes.data);

    } catch (error: any) {
      console.error("Erro ao carregar projeto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar projeto",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numberValue = Number(value) / 100;
    setter(numberValue.toString());
  };

  const handleSaveProjeto = async () => {
    if (!titulo || !clienteId) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha título e cliente",
      });
      return;
    }

    setLoading(true);
    try {
      if (!user || !masterId) throw new Error("Usuário não autenticado");

      const projetoData = {
        titulo,
        descricao,
        notas: notas,
        status,
        cliente_id: clienteId,
        user_id: masterId,
        valor_total: valorTotal ? parseFloat(valorTotal) : null,
        valor_por_sessao: valorPorSessao ? parseFloat(valorPorSessao) : null,
        quantidade_sessoes: quantidadeSessoes ? parseInt(quantidadeSessoes) : null,
        categoria,
        capa_url: capaUrl,
        drive_link: driveLink || null,
        data_inicio: parseDateOnly(dataInicio)?.toISOString(),
        data_fim: parseDateOnly(dataFim)?.toISOString(),
        updated_at: new Date().toISOString(),
      };

      let newProjetoId = projetoId;

      if (projetoId) {
        const { error } = await supabase
          .from("projetos")
          .update(projetoData)
          .eq("id", projetoId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("projetos")
          .insert([projetoData])
          .select()
          .single();

        if (error) throw error;
        newProjetoId = data.id;
      }

      toast({
        title: "Sucesso",
        description: `Projeto ${projetoId ? "atualizado" : "criado"} com sucesso`,
      });
      onSuccess();

      // Se estamos criando, podemos querer fechar ou manter aberto para adicionar referencias.
      // O comportamento original fechava.
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReferencia = async () => {
    if (!projetoId || !novaRefTitulo || !novaRefUrl) {
      toast({
        variant: "destructive",
        title: "Preencha título e URL da referência",
      });
      return;
    }

    try {
      if (!masterId) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("projeto_referencias")
        .insert([
          {
            projeto_id: projetoId,
            user_id: masterId,
            titulo: novaRefTitulo,
            url: novaRefUrl,
            descricao: novaRefDescricao,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setReferencias([data, ...referencias]);
      setNovaRefTitulo("");
      setNovaRefUrl("");
      setNovaRefDescricao("");

      toast({
        title: "Referência adicionada",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar referência",
        description: error.message,
      });
    }
  };

  const handleDeleteReferencia = async (id: string) => {
    try {
      const { error } = await supabase
        .from("projeto_referencias")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReferencias(referencias.filter((r) => r.id !== id));
      toast({ title: "Referência removida" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover referência",
        description: error.message,
      });
    }
  };

  const handleCapaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      if (!masterId) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${masterId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-references")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("project-references")
        .getPublicUrl(filePath);

      setCapaUrl(data.publicUrl);
      toast({ title: "Capa enviada com sucesso!" });

    } catch (error: any) {
      console.error("Erro ao fazer upload da capa:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!projetoId) {
      toast({
        variant: "destructive",
        title: "Salve o projeto primeiro antes de adicionar arquivos",
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      if (!masterId) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${masterId}/${projetoId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("project-references")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("project-references")
        .getPublicUrl(fileName);

      const { data, error: dbError } = await supabase
        .from("projeto_anexos")
        .insert([
          {
            projeto_id: projetoId,
            user_id: masterId,
            nome: file.name,
            url: publicUrl,
            tipo: file.type,
            tamanho: file.size,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      setAnexos([data, ...anexos]);
      toast({ title: "Arquivo enviado com sucesso" });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar arquivo",
        description: error.message,
      });
    } finally {
      setUploadingFile(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleDeleteAnexo = async (id: string, url: string) => {
    try {
      // Extrair path do arquivo da URL se possível, ou assumir estrutura
      // url format: .../storage/v1/object/public/project-references/path/to/file
      const pathPart = url.split("/project-references/")[1];
      if (pathPart) {
        const { error: storageError } = await supabase.storage
          .from("project-references")
          .remove([pathPart]);

        if (storageError) console.error("Erro ao remover do storage:", storageError);
      }

      const { error: dbError } = await supabase
        .from("projeto_anexos")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      setAnexos(anexos.filter((a) => a.id !== id));
      toast({ title: "Anexo removido" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover anexo",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveProjeto(); }}>
          <DialogHeader>
            <DialogTitle>
              {projetoId ? "Editar Projeto" : "Criar Novo Projeto"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
              <TabsTrigger value="referencias">Referências</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">

              {/* Grupo: Informações Básicas */}
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Informações Básicas
                </h3>

                <div className="space-y-2">
                  <Label>Capa do Projeto</Label>
                  <div className="flex items-center gap-4">
                    {capaUrl && (
                      <img
                        src={capaUrl}
                        alt="Capa"
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleCapaUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="titulo" className="text-sm">Título do Projeto *</Label>
                  <div className="relative">
                    <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="titulo"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Nome do projeto"
                      className="h-9 pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cliente" className="text-sm">Cliente *</Label>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger className="h-9">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecione um cliente" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grupo: Status e Classificação */}
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" /> Status e Classificação
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-sm">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-9">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="categoria" className="text-sm">Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tatuagem">Tatuagem</SelectItem>
                        <SelectItem value="piercing">Piercing</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="consultoria">Consultoria</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Grupo: Cronograma */}
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Cronograma
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="dataInicio" className="text-sm">Data de Início</Label>
                    <div className="relative">
                      <DatePickerInput
                        value={dataInicio}
                        onChange={setDataInicio}
                        placeholder="dd/mm/aaaa"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dataFim" className="text-sm">Data de Fim (Prevista)</Label>
                    <DatePickerInput
                      value={dataFim}
                      onChange={setDataFim}
                      placeholder="dd/mm/aaaa"
                      minDate={dataInicio ? parseDateOnly(dataInicio) : undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Grupo: Financeiro */}
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Financeiro
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="valorPorSessao" className="text-sm">Valor/Sessão (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="valorPorSessao"
                        value={valorPorSessao ? formatCurrencyBR(valorPorSessao) : ""}
                        onChange={handleCurrencyChange(setValorPorSessao)}
                        className="h-9 pl-9"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quantidadeSessoes" className="text-sm">Qtd. Sessões</Label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="quantidadeSessoes"
                        type="number"
                        value={quantidadeSessoes}
                        onChange={(e) => setQuantidadeSessoes(e.target.value)}
                        className="h-9 pl-9"
                        placeholder="Ex: 5"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="valorTotal" className="text-sm">Valor Total</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="valorTotal"
                        value={valorTotal ? formatCurrencyBR(valorTotal) : ""}
                        onChange={handleCurrencyChange(setValorTotal)}
                        className="h-9 pl-9 bg-muted/50"
                        placeholder="R$ 0,00"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição - Grupo Final */}
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Detalhes
                </h3>
                <div className="space-y-1">
                  <Label htmlFor="descricao" className="text-sm">Descrição Breve</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Breve descrição do projeto"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="driveLink" className="text-sm">Link do Google Drive</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="driveLink"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="h-9 pl-9"
                      type="url"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Cole o link da pasta do Google Drive com os documentos do projeto</p>
                </div>
              </div>

            </TabsContent>

            <TabsContent value="notas" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notas">Notas Detalhadas do Projeto</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Descreva as ideias, objetivos, requisitos, cronograma e qualquer informação relevante sobre o projeto..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="referencias" className="space-y-4">
              {projetoId && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Título da Referência</Label>
                      <Input
                        value={novaRefTitulo}
                        onChange={(e) => setNovaRefTitulo(e.target.value)}
                        placeholder="Ex: Design inspiração"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={novaRefUrl}
                        onChange={(e) => setNovaRefUrl(e.target.value)}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        value={novaRefDescricao}
                        onChange={(e) => setNovaRefDescricao(e.target.value)}
                        placeholder="O que há de interessante nesta referência?"
                        rows={2}
                      />
                    </div>
                    <Button onClick={handleAddReferencia} className="w-full">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Adicionar Referência
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {referencias.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {projetoId
                      ? "Nenhuma referência adicionada ainda"
                      : "Salve o projeto para adicionar referências"}
                  </p>
                ) : (
                  referencias.map((ref) => (
                    <Card key={ref.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{ref.titulo}</h4>
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              {ref.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {ref.descricao && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {ref.descricao}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReferencia(ref.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="anexos" className="space-y-4">
              {projetoId && (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para fazer upload</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Imagens, PDFs, documentos, etc.
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                  </label>
                </div>
              )}

              <div className="space-y-2">
                {anexos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {projetoId
                      ? "Nenhum anexo enviado ainda"
                      : "Salve o projeto para adicionar anexos"}
                  </p>
                ) : (
                  anexos.map((anexo) => (
                    <Card key={anexo.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <h4 className="font-semibold truncate">{anexo.nome}</h4>
                              <p className="text-xs text-muted-foreground">
                                {(anexo.tamanho / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(anexo.url, "_blank")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAnexo(anexo.id, anexo.url)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Salvando..." : projetoId ? "Salvar" : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
