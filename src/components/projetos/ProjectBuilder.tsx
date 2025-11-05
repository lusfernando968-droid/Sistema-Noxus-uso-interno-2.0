import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Link as LinkIcon, FileText, Trash2, ExternalLink, Download, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId?: string;
  clientes: Array<{ id: string; nome: string }>;
  onSuccess: () => void;
}

interface Referencia {
  id: string;
  titulo: string;
  url: string;
  descricao: string;
}

interface Anexo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
}

export function ProjectBuilder({ open, onOpenChange, projetoId, clientes, onSuccess }: ProjectBuilderProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Dados do projeto
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [notas, setNotas] = useState("");
  const [status, setStatus] = useState<string>("planejamento");
  const [clienteId, setClienteId] = useState<string>("");
  
  // Dados financeiros e de sessões
  const [valorTotal, setValorTotal] = useState<string>("");
  const [valorPorSessao, setValorPorSessao] = useState<string>("");
  const [quantidadeSessoes, setQuantidadeSessoes] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [dataInicioOpen, setDataInicioOpen] = useState(false);
  const [dataFimOpen, setDataFimOpen] = useState(false);

  // Referências e anexos
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);

  // Novos itens
  const [novaRefTitulo, setNovaRefTitulo] = useState("");
  const [novaRefUrl, setNovaRefUrl] = useState("");
  const [novaRefDescricao, setNovaRefDescricao] = useState("");

  // Helpers de moeda BRL
  const formatCurrencyBR = (value: string) => {
    if (value === "") return "";
    const num = Number(value);
    if (!isFinite(num)) return "";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleCurrencyChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (!digitsOnly) {
      setter("");
      return;
    }
    const cents = parseInt(digitsOnly, 10);
    const value = (cents / 100).toFixed(2);
    setter(value);
  };

  useEffect(() => {
    if (open && projetoId) {
      loadProjeto();
    } else if (!open) {
      resetForm();
    }
  }, [open, projetoId]);

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setNotas("");
    setStatus("planejamento");
    setClienteId("");
    setValorTotal("");
    setValorPorSessao("");
    setQuantidadeSessoes("");
    setDataInicio("");
    setDataFim("");
    setCategoria("");
    setReferencias([]);
    setAnexos([]);
    setNovaRefTitulo("");
    setNovaRefUrl("");
    setNovaRefDescricao("");
  };

  const loadProjeto = async () => {
    if (!projetoId) return;

    setLoading(true);
    try {
      // Carregar dados do projeto
      const { data: projeto, error: projetoError } = await supabase
        .from("projetos")
        .select("*")
        .eq("id", projetoId)
        .single();

      if (projetoError) throw projetoError;

      setTitulo(projeto.titulo);
      setDescricao(projeto.descricao || "");
      setNotas(projeto.notas || "");
      setStatus(projeto.status);
      setClienteId(projeto.cliente_id);
      setValorTotal(projeto.valor_total?.toString() || "");
      setValorPorSessao(projeto.valor_por_sessao?.toString() || "");
      setQuantidadeSessoes(projeto.quantidade_sessoes?.toString() || "");
      setDataInicio(projeto.data_inicio || "");
      setDataFim(projeto.data_fim || "");
      setCategoria(projeto.categoria || "");

      // Carregar referências
      const { data: refs, error: refsError } = await supabase
        .from("projeto_referencias")
        .select("*")
        .eq("projeto_id", projetoId)
        .order("created_at", { ascending: false });

      if (refsError) throw refsError;
      setReferencias(refs || []);

      // Carregar anexos
      const { data: anexosData, error: anexosError } = await supabase
        .from("projeto_anexos")
        .select("*")
        .eq("projeto_id", projetoId)
        .order("created_at", { ascending: false });

      if (anexosError) throw anexosError;
      setAnexos(anexosData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar projeto",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
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
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Usuário não autenticado");

      const projetoData = {
        titulo,
        descricao,
        notas,
        status,
        cliente_id: clienteId,
        user_id: user.id,
        valor_total: valorTotal ? parseFloat(valorTotal) : null,
        valor_por_sessao: valorPorSessao ? parseFloat(valorPorSessao) : null,
        quantidade_sessoes: quantidadeSessoes ? parseInt(quantidadeSessoes) : null,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        categoria: categoria || null,
      };

      if (projetoId) {
        const { error } = await supabase
          .from("projetos")
          .update(projetoData)
          .eq("id", projetoId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("projetos")
          .insert([projetoData]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Projeto ${projetoId ? "atualizado" : "criado"} com sucesso`,
      });
      onSuccess();
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
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("projeto_referencias")
        .insert([
          {
            projeto_id: projetoId,
            user_id: user.id,
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
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${projetoId}/${Date.now()}.${fileExt}`;

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
            user_id: user.id,
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
      toast({
        variant: "destructive",
        title: "Erro ao enviar arquivo",
        description: error.message,
      });
    } finally {
      setUploadingFile(false);
      event.target.value = "";
    }
  };

  const handleDeleteAnexo = async (id: string, url: string) => {
    try {
      const path = url.split("/project-references/")[1];
      
      const { error: storageError } = await supabase.storage
        .from("project-references")
        .remove([path]);

      if (storageError) throw storageError;

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

          <TabsContent value="info" className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="titulo" className="text-sm">Título do Projeto *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Nome do projeto"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cliente" className="text-sm">Cliente *</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um cliente" />
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

              <div className="space-y-1">
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                    <SelectItem value="andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dataInicio" className="text-sm">Data de Início</Label>
                <Popover open={dataInicioOpen} onOpenChange={setDataInicioOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio
                        ? format(new Date(dataInicio), "dd/MM/yyyy", { locale: ptBR })
                        : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComp
                      mode="single"
                      selected={dataInicio ? new Date(dataInicio) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setDataInicio(format(date, "yyyy-MM-dd"));
                          setDataInicioOpen(false);
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dataFim" className="text-sm">Data de Fim (Prevista)</Label>
                <Popover open={dataFimOpen} onOpenChange={setDataFimOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim
                        ? format(new Date(dataFim), "dd/MM/yyyy", { locale: ptBR })
                        : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComp
                      mode="single"
                      selected={dataFim ? new Date(dataFim) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setDataFim(format(date, "yyyy-MM-dd"));
                          setDataFimOpen(false);
                        }
                      }}
                      locale={ptBR}
                      disabled={(date) => (dataInicio ? date < new Date(dataInicio) : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* 1º: Valor/Sessão */}
              <div className="space-y-1">
                <Label htmlFor="valorPorSessao" className="text-sm">Valor/Sessão (R$)</Label>
                <Input
                  id="valorPorSessao"
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyBR(valorPorSessao)}
                  onChange={handleCurrencyChange(setValorPorSessao)}
                  placeholder="R$ 0,00"
                  className="h-9"
                />
              </div>
              {/* 2º: Valor Total */}
              <div className="space-y-1">
                <Label htmlFor="valorTotal" className="text-sm">Valor Total (R$)</Label>
                <Input
                  id="valorTotal"
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyBR(valorTotal)}
                  onChange={handleCurrencyChange(setValorTotal)}
                  placeholder="R$ 0,00"
                  className="h-9"
                />
              </div>
              {/* 3º: Quantidade de Sessões */}
              <div className="space-y-1">
                <Label htmlFor="quantidadeSessoes" className="text-sm">Qtd. Sessões</Label>
                <Input
                  id="quantidadeSessoes"
                  type="number"
                  min="1"
                  value={quantidadeSessoes}
                  onChange={(e) => setQuantidadeSessoes(e.target.value)}
                  placeholder="Ex: 5"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="descricao" className="text-sm">Descrição Breve</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Breve descrição do projeto"
                rows={2}
                className="text-sm"
              />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : projetoId ? "Salvar" : "Criar Projeto"}
          </Button>
        </div>
        </form>
      </DialogContent>
      </Dialog>
  );
}
