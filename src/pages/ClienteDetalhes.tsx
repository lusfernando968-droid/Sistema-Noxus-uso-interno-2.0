import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, DollarSign, FolderOpen, Eye, Camera, Loader2, Instagram, Trash2, Ban, CheckCircle } from "lucide-react";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClienteDetalhesSkeleton } from "@/components/ui/skeletons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Interfaces
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  instagram?: string;
  documento?: string;
  endereco?: string;
  indicado_por?: string;
  indicado_por_nome?: string;
  created_at: string;
  updated_at: string;
  foto_url?: string | null;
  status: 'ativo' | 'inativo';
  motivo_inativacao?: string | null;
}

interface ProjetoCliente {
  id: string;
  titulo: string;
  status: string;
  valor_total?: number;
  valor_pago?: number;
  categoria?: string;
  created_at: string;
}

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [projetos, setProjetos] = useState<ProjetoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjetos: 0,
    valorTotal: 0,
    valorPago: 0,
    projetosAtivos: 0
  });


  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [indicados, setIndicados] = useState<Array<{ id: string; nome: string }>>([]);

  // Estados para desativação
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [motivoInativacao, setMotivoInativacao] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleDeactivate = async () => {
    if (!cliente || !motivoInativacao.trim()) {
      toast({ title: "Motivo obrigatório", description: "Por favor, informe o motivo da desativação.", variant: "destructive" });
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ status: 'inativo', motivo_inativacao: motivoInativacao })
        .eq('id', cliente.id);

      if (error) throw error;

      setCliente({ ...cliente, status: 'inativo', motivo_inativacao: motivoInativacao });
      setIsDeactivateOpen(false);
      setMotivoInativacao("");
      toast({ title: "Cliente desativado", description: "O cliente foi desativado com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao desativar", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReactivate = async () => {
    if (!cliente) return;
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ status: 'ativo', motivo_inativacao: null })
        .eq('id', cliente.id);

      if (error) throw error;

      setCliente({ ...cliente, status: 'ativo', motivo_inativacao: null });
      toast({ title: "Cliente reativado", description: "O cliente está ativo novamente." });
    } catch (error: any) {
      toast({ title: "Erro ao reativar", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!cliente) return;
    setUploadingPhoto(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("Usuário não autenticado");
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user.id);
      const targets = (files || [])
        .filter(f => f.name.startsWith(`${cliente.id}.`))
        .map(f => `${user.id}/${f.name}`);
      if (targets.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove(targets);
        if (removeError) throw removeError;
      }
      const { data: colProbe, error: colError } = await supabase
        .from("clientes")
        .select("foto_url")
        .limit(1);
      if (colError) {
        setCliente({ ...cliente, foto_url: null });
        toast({
          title: "Coluna foto_url ausente",
          description: "Aplique a migration para refletir a remoção no banco",
          variant: "destructive",
        });
      } else {
        const { error: updateError } = await supabase
          .from("clientes")
          .update({ foto_url: null })
          .eq("id", cliente.id);
        if (updateError) throw updateError;
        setCliente({ ...cliente, foto_url: null });
      }
      toast({ title: "Foto removida", description: "A foto do cliente foi removida" });
    } catch (err: any) {
      toast({ title: "Erro ao remover foto", description: err?.message || "Falha ao remover a imagem", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const compressToMax2MB = async (file: File) => {
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    const readAsDataURL = (f: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);
    const maxW = 1024;
    const maxH = 1024;
    let w = img.width;
    let h = img.height;
    const ratio = Math.min(1, maxW / w, maxH / h);
    w = Math.max(1, Math.round(w * ratio));
    h = Math.max(1, Math.round(h * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const toBlob = (q: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", q));
    let quality = 0.9;
    let blob = await toBlob(quality);
    const limit = 2 * 1024 * 1024;
    while (blob && blob.size > limit && quality > 0.4) {
      quality -= 0.1;
      blob = await toBlob(quality);
    }
    if (!blob) return file;
    if (blob.size >= file.size && file.size <= limit) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  };

  useEffect(() => {
    const carregarCliente = async () => {
      if (!id) {
        toast({
          title: "Erro",
          description: "ID do cliente não encontrado",
          variant: "destructive",
        });
        navigate('/clientes');
        return;
      }

      try {
        setLoading(true);

        // Buscar cliente
        const { data: clienteEncontrado, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single();

        if (clienteError || !clienteEncontrado) {
          toast({
            title: "Cliente não encontrado",
            description: "O cliente solicitado não existe",
            variant: "destructive",
          });
          navigate('/clientes');
          return;
        }


        const { data: projetosCliente, error: projetosError } = await supabase
          .from('projetos')
          .select('*')
          .eq('cliente_id', id);

        if (projetosError) throw projetosError;

        const projetosData = projetosCliente || [];

        // Calcular estatísticas
        const totalProjetos = projetosData.length;
        const valorTotal = projetosData.reduce((sum, p) => sum + (p.valor_total || 0), 0);
        const projetosAtivos = projetosData.filter(p => p.status === 'andamento').length;

        // Calcular valor pago total
        let valorPagoTotal = 0;
        for (const projeto of projetosData) {
          const { data: sessoes } = await supabase
            .from('projeto_sessoes')
            .select('valor_sessao')
            .eq('projeto_id', projeto.id)
            .eq('status_pagamento', 'pago');

          valorPagoTotal += (sessoes || []).reduce((sum, s) => sum + (s.valor_sessao || 0), 0);
        }

        // Formatar projetos para exibição
        const projetosFormatados: ProjetoCliente[] = projetosData.map(p => ({
          id: p.id,
          titulo: p.titulo,
          status: p.status,
          valor_total: p.valor_total,
          valor_pago: 0,
          categoria: p.categoria,
          created_at: p.created_at
        }));

        let indicadoPorNome: string | undefined = undefined;
        if (clienteEncontrado.indicado_por) {
          const { data: indicador } = await supabase
            .from('clientes')
            .select('nome')
            .eq('id', clienteEncontrado.indicado_por)
            .single();
          indicadoPorNome = indicador?.nome;
        }

        setCliente({ ...clienteEncontrado, indicado_por_nome: indicadoPorNome });

        const { data: indicadosData } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('indicado_por', id);
        setIndicados(indicadosData || []);

        try {
          const { data: authData } = await supabase.auth.getUser();
          const user = authData.user;
          if (user && !clienteEncontrado.foto_url) {
            const { data: files } = await supabase.storage
              .from('avatars')
              .list(user.id);
            const match = (files || []).find(f => f.name.startsWith(`${clienteEncontrado.id}.`));
            if (match) {
              const path = `${user.id}/${match.name}`;
              const { data: signed } = await supabase.storage
                .from('avatars')
                .createSignedUrl(path, 60 * 60 * 24 * 30);
              const url = signed?.signedUrl || null;
              if (url) {
                const { data: colProbe, error: colError } = await supabase
                  .from('clientes')
                  .select('foto_url')
                  .limit(1);
                if (!colError) {
                  await supabase
                    .from('clientes')
                    .update({ foto_url: url })
                    .eq('id', clienteEncontrado.id);
                }
                setCliente(prev => prev ? { ...prev, foto_url: url } : prev);
              }
            }
          }
        } catch { }
        setProjetos(projetosFormatados);
        setStats({
          totalProjetos,
          valorTotal,
          valorPago: valorPagoTotal,
          projetosAtivos
        });

      } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        toast({
          title: "Erro ao carregar cliente",
          description: "Não foi possível carregar os dados do cliente",
          variant: "destructive",
        });
        navigate('/clientes');
      } finally {
        setLoading(false);
      }
    };

    carregarCliente();
  }, [id, navigate, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'andamento':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'concluido':
        return 'bg-success/10 text-success border-success/20';
      case 'cancelado':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'Planejamento';
      case 'andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return <ClienteDetalhesSkeleton />;
  }

  if (!cliente) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/clientes')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{cliente.nome}</h1>
              {cliente.status === 'inativo' ? (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" /> Inativo
                </Badge>
              ) : (
                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 gap-1">
                  <CheckCircle className="h-3 w-3" /> Ativo
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Detalhes do cliente</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cliente.status === 'inativo' ? (
            <Button
              onClick={handleReactivate}
              disabled={isUpdatingStatus}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Reativar Cliente
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setIsDeactivateOpen(true)}
              disabled={isUpdatingStatus}
            >
              <Ban className="h-4 w-4 mr-2" />
              Desativar Cliente
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar este cliente? Esta ação impedirá novos agendamentos e transações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="motivo">Motivo da desativação (obrigatório)</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Mudou de cidade, Indimplência, Pediu cancelamento..."
              value={motivoInativacao}
              onChange={(e) => setMotivoInativacao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeactivateOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isUpdatingStatus || !motivoInativacao.trim()}
            >
              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirmar Desativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Projetos</p>
                <p className="text-2xl font-bold">{stats.totalProjetos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">R$ {stats.valorTotal.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="text-2xl font-bold">R$ {stats.valorPago.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                <p className="text-2xl font-bold">{stats.projetosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="info" className="rounded-xl">Informações</TabsTrigger>
          <TabsTrigger value="projetos" className="rounded-xl">Projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Foto do Cliente + Botão de Upload */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    avatarUrl={cliente.foto_url || null}
                    name={cliente.nome}
                    className="h-20 w-20"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Foto do Cliente</p>
                    <p className="text-xs text-muted-foreground">Use uma imagem quadrada para melhor resultado</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl gap-2"
                    disabled={uploadingPhoto}
                    onClick={() => document.getElementById("cliente-foto-upload")?.click()}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    Adicionar foto
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl text-destructive"
                    disabled={uploadingPhoto || !cliente.foto_url}
                    onClick={handleRemovePhoto}
                    title="Remover foto"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    id="cliente-foto-upload"
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0 || !cliente) return;
                      const originalFile = e.target.files[0];
                      setUploadingPhoto(true);
                      try {
                        const { data: authData } = await supabase.auth.getUser();
                        const user = authData.user;
                        if (!user) throw new Error("Usuário não autenticado");
                        const processed = await compressToMax2MB(originalFile);
                        const ext = processed.name.split(".").pop();
                        const fileName = `${cliente.id}.${ext}`;
                        const filePath = `${user.id}/${fileName}`;
                        const { error: uploadError } = await supabase.storage
                          .from("avatars")
                          .upload(filePath, processed, { upsert: true });
                        if (uploadError) throw uploadError;
                        const { data: signed } = await supabase.storage
                          .from("avatars")
                          .createSignedUrl(filePath, 60 * 60 * 24 * 30);
                        const publicUrl = signed?.signedUrl || null;
                        const { data: colProbe, error: colError } = await supabase
                          .from("clientes")
                          .select("foto_url")
                          .limit(1);
                        if (colError) {
                          setCliente({ ...cliente, foto_url: publicUrl });
                          toast({
                            title: "Coluna foto_url ausente",
                            description: "Aplique a migration para criar foto_url em clientes",
                            variant: "destructive",
                          });
                        } else {
                          const { error: updateError } = await supabase
                            .from("clientes")
                            .update({ foto_url: publicUrl })
                            .eq("id", cliente.id);
                          if (updateError) throw updateError;
                          setCliente({ ...cliente, foto_url: publicUrl });
                        }
                        toast({
                          title: "Foto atualizada",
                          description: "A foto do cliente foi atualizada com sucesso",
                        });
                      } catch (err: any) {
                        console.error("Erro ao enviar foto do cliente", { err });
                        toast({
                          title: "Erro ao enviar imagem",
                          description: (err?.message || "Verifique o bucket 'avatars' no Supabase"),
                          variant: "destructive",
                        });
                      } finally {
                        setUploadingPhoto(false);
                        setFileInputKey((k) => k + 1);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cliente.status === 'inativo' && cliente.motivo_inativacao && (
                  <div className="space-y-2 md:col-span-2 bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <label className="text-sm font-medium text-destructive flex items-center gap-2">
                      <Ban className="h-4 w-4" /> Motivo da Inativação
                    </label>
                    <p className="text-gray-900">{cliente.motivo_inativacao}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-lg">{cliente.nome}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{cliente.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p>{cliente.telefone}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Instagram</label>
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    {cliente.instagram ? (
                      <a href={cliente.instagram} target="_blank" rel="noreferrer" className="text-primary underline text-sm">{cliente.instagram}</a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Não informado</span>
                    )}
                  </div>
                </div>

                {cliente.documento && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Documento</label>
                    <p>{cliente.documento}</p>
                  </div>
                )}

                {cliente.endereco && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p>{cliente.endereco}</p>
                    </div>
                  </div>
                )}

                {cliente.indicado_por && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Indicado por</label>
                    <p>{cliente.indicado_por_nome || cliente.indicado_por}</p>
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Indicou</label>
                  {indicados.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhum</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {indicados.map((i) => (
                        <Badge
                          key={i.id}
                          variant="secondary"
                          className="rounded-full text-xs cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/clientes/${i.id}`)}
                          title={`Abrir perfil de ${i.nome}`}
                        >
                          {i.nome}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Cliente desde</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projetos" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Projetos do Cliente
              </CardTitle>
              <CardDescription>
                Histórico completo de projetos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projetos.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum projeto encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projetos.map((projeto) => (
                    <div
                      key={projeto.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{projeto.titulo}</h3>
                          <Badge className={`${getStatusColor(projeto.status)} border`}>
                            {getStatusLabel(projeto.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {projeto.categoria && (
                            <span>{projeto.categoria}</span>
                          )}
                          {projeto.valor_total && (
                            <span>R$ {projeto.valor_total.toLocaleString('pt-BR')}</span>
                          )}
                          <span>{new Date(projeto.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/projetos/${projeto.id}`)}
                        className="rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
