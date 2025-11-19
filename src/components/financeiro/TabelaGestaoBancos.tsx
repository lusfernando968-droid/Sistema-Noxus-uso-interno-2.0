import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomSelect } from "@/components/ui/custom-select";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContaBancariaRecord, BancoRecord, useContasBancarias, TIPOS_CONTA, MOEDAS } from "@/hooks/useContasBancarias";
import { z } from "zod";

const contaFormSchema = z.object({
  nome: z.string().min(2, "Nome da conta muito curto"),
  banco_id: z.string().uuid("Selecione um banco válido"),
  agencia: z.string().optional(),
  numero: z.string().optional(),
  tipo: z.string().optional(),
  moeda: z.string().default("BRL"),
  saldo_inicial: z.number().nonnegative("Saldo inicial não pode ser negativo").default(0),
});

type FormData = z.infer<typeof contaFormSchema>;

export default function TabelaGestaoBancos() {
  console.log('TabelaGestaoBancos renderizando');
  const { user, loading: authLoading } = useAuth();
  console.log('User:', user?.id, 'AuthLoading:', authLoading);
  const { items: contas, loading, fetchAll, insert, update, archive } = useContasBancarias();
  const [bancos, setBancos] = useState<BancoRecord[]>([]);
  const [loadingBancos, setLoadingBancos] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddBankDialogOpen, setIsAddBankDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    banco_id: "",
    agencia: "",
    numero: "",
    tipo: "",
    moeda: "BRL",
    saldo_inicial: 0,
  });

  console.log('Estado formData:', formData);
  console.log('Estado bancos:', bancos.length, 'bancos');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estado para formulário de novo banco
  const [newBankData, setNewBankData] = useState({
    nome_curto: "",
    nome_completo: "",
    codigo: "",
    cor_primaria: "#1e40af"
  });
  const [newBankErrors, setNewBankErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('useEffect user disparado, user:', user?.id);
    if (user) {
      console.log('User detectado, carregando dados...');
      fetchBancos();
      fetchAll();
    } else {
      console.log('User não detectado');
    }
  }, [user]);

  // Carregar bancos imediatamente quando o componente montar
  useEffect(() => {
    console.log('Componente montado, verificando user...');
    if (user) {
      console.log('User já disponível, carregando bancos...');
      fetchBancos();
    }
  }, []); // Executar uma vez na montagem

  // Carregar bancos quando authLoading mudar de true para false
  useEffect(() => {
    console.log('AuthLoading mudou:', authLoading);
    if (!authLoading && user) {
      console.log('Auth completo, user disponível, carregando bancos...');
      fetchBancos();
    }
  }, [authLoading, user]);

  // Garantir que bancos estejam sempre disponíveis
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && bancos.length === 0 && !loadingBancos) {
        console.log('Bancos vazio, recarregando...');
        fetchBancos();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, bancos.length, loadingBancos]);

  // Recarregar bancos quando o dialog de adicionar banco for fechado
  useEffect(() => {
    console.log('useEffect dialog fechado disparado:', {
      isAddBankDialogOpen,
      user: !!user,
      timestamp: new Date().toISOString()
    });
    
    if (!isAddBankDialogOpen && user) {
      console.log('Dialog de adicionar banco fechado, recarregando bancos...');
      fetchBancos().then(() => {
        console.log('fetchBancos concluído após fechar dialog');
      }).catch(err => {
        console.error('Erro ao recarregar bancos após fechar dialog:', err);
      });
    }
  }, [isAddBankDialogOpen, user]);

  useEffect(() => {
    console.log('Estado bancos mudou:', bancos.length, 'bancos');
    console.log('Bancos atuais:', bancos.map(b => ({ id: b.id, nome_curto: b.nome_curto })));
    
    // Verificar se há algum banco novo que deveria estar aparecendo
    if (bancos.length > 0) {
      const ultimosBancos = bancos.slice(-3); // Últimos 3 bancos
      console.log('Últimos bancos adicionados:', ultimosBancos);
    }
  }, [bancos]);

  useEffect(() => {
    console.log('Dialog aberto:', isDialogOpen);
    if (isDialogOpen) {
      console.log('Dialog aberto, garantindo que bancos estão carregados');
      if (bancos.length === 0) {
        fetchBancos();
      }
    }
  }, [isDialogOpen]);

  const fetchBancos = async () => {
    if (!user) return;
    console.log('fetchBancos chamado');
    try {
      console.log('Iniciando fetchBancos...');
      setLoadingBancos(true);
      console.log('Fazendo query no Supabase...');
      
      // Query simplificada para debug
      let query = supabase
        .from("bancos")
        .select("*")
        .order("nome_curto", { ascending: true });
      
      console.log('Query construída, executando...');
      const { data, error } = await query;

      console.log('Dados recebidos:', data?.length || 0, 'bancos');
      console.log('Primeiros bancos:', data?.slice(0, 3));
      console.log('Erro:', error);
      
      if (error) {
        console.error('Erro na query:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        throw error;
      }
      
      console.log('Atualizando estado com bancos...');
      const bancosData = Array.isArray(data) ? data : (data ? [data] : []);
      setBancos(bancosData);
      console.log('Bancos atualizados no estado:', bancosData.length);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
      console.error("Tipo do erro:", typeof error);
      console.error("Detalhes completos do erro:", JSON.stringify(error, null, 2));
      
      let errorMessage = "Erro ao carregar lista de bancos";
      if (error instanceof Error) {
        errorMessage = `Erro: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoadingBancos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      // Validar formulário
      const validatedData = contaFormSchema.parse(formData);
      setFormErrors({});

      if (isEditMode && editingId) {
        await update(editingId, validatedData);
        toast.success("Conta bancária atualizada com sucesso!");
      } else {
        await insert(validatedData);
        toast.success("Conta bancária criada com sucesso!");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      } else {
        toast.error(error.message || "Erro ao salvar conta");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      banco_id: "",
      agencia: "",
      numero: "",
      tipo: "",
      moeda: "BRL",
      saldo_inicial: 0,
    });
    setFormErrors({});
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleAddNewBank = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleAddNewBank chamado');
    console.log('Dados do novo banco:', newBankData);
    console.log('Usuário atual:', user?.id);
    
    try {
      // Validação básica
      const errors: Record<string, string> = {};
      if (!newBankData.nome_curto.trim()) {
        errors.nome_curto = "Nome curto é obrigatório";
      }
      if (!newBankData.nome_completo.trim()) {
        errors.nome_completo = "Nome completo é obrigatório";
      }
      if (!newBankData.codigo.trim()) {
        errors.codigo = "Código do banco é obrigatório";
      }
      
      if (Object.keys(errors).length > 0) {
        console.log('Erros de validação:', errors);
        setNewBankErrors(errors);
        return;
      }
      
      // Verificar autenticação antes de tentar inserir
      if (!user) {
        toast.error("Você precisa estar logado para adicionar um banco");
        return;
      }
      
      // Simplificar: tentar inserir diretamente com tratamento de erro
      console.log('Iniciando inserção no Supabase...');
      console.log('Preparando dados para inserção:', {
        nome_curto: newBankData.nome_curto.trim(),
        nome: newBankData.nome_completo.trim(),
        codigo: newBankData.codigo.trim(),
        cor_primaria: newBankData.cor_primaria,
        ativo: true
      });
      
      // Inserir novo banco no Supabase
      const { data, error } = await supabase
        .from("bancos")
        .insert([{
          nome_curto: newBankData.nome_curto.trim(),
          nome: newBankData.nome_completo.trim(),
          codigo: newBankData.codigo.trim(),
          cor_primaria: newBankData.cor_primaria,
          ativo: true,
          user_id: user.id
        }])
        .select()
        .single();
      
      console.log('Resultado da inserção:', { data, error });
      
      if (error) {
        console.error('Erro do Supabase:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        console.error('Detalhes:', error.details);
        console.error('Dica:', error.hint);
        
        // Tratamento específico de erros
        if (error.code === '42501') {
          toast.error("Permissão negada. Verifique as configurações de segurança.");
        } else if (error.code === '23505') {
          toast.error("Código de banco já existe. Use um código diferente.");
        } else if (error.code === '23502') {
          toast.error(`Campo obrigatório faltando: ${error.column_name}`);
        } else if (error.code === '23503') {
          toast.error("Violação de chave estrangeira.");
        } else {
          toast.error(error.message || "Erro ao adicionar banco");
        }
        
        return; // Importante: sair da função em caso de erro
      }
      
      console.log('Banco inserido com sucesso:', data);
      
      // Atualizar lista de bancos - com retry em caso de erro
      try {
        console.log('Atualizando lista de bancos...');
        await fetchBancos(); // Recarregar do banco ao invés de adicionar ao estado
        console.log('Lista de bancos atualizada');
      } catch (updateError) {
        console.error('Erro ao atualizar lista:', updateError);
        console.error('Tipo do erro na atualização:', typeof updateError);
        console.error('Stack do erro:', updateError instanceof Error ? updateError.stack : 'N/A');
        // Mesmo que haja erro na atualização, continuar com sucesso
        // Não vamos mostrar toast de erro aqui para não confundir o usuário
      }
      
      // Selecionar o novo banco no formulário principal
      console.log('Selecionando novo banco no formulário:', data.id);
      setFormData(prev => ({ ...prev, banco_id: data.id }));
      
      // Limpar formulário e fechar dialog
      console.log('Limpando formulário e fechando dialog...');
      setNewBankData({
        nome_curto: "",
        nome_completo: "",
        codigo: "",
        cor_primaria: "#1e40af"
      });
      setNewBankErrors({});
      setIsAddBankDialogOpen(false);
      
      toast.success("Banco adicionado com sucesso!");
      console.log('Processo de adição de banco concluído com sucesso');
      
    } catch (error: any) {
      console.error("Erro geral ao adicionar banco:", error);
      toast.error("Erro inesperado ao adicionar banco");
    }
  };

  const openNewDialog = () => {
    console.log('Abrindo dialog novo');
    resetForm();
    setIsDialogOpen(true);
    // Forçar recarregar bancos quando abrir o dialog
    fetchBancos();
  };

  const openEditDialog = (conta: ContaBancariaRecord) => {
    setIsEditMode(true);
    setEditingId(conta.id!);
    setFormData({
      nome: conta.nome,
      banco_id: conta.banco_id || "",
      agencia: conta.agencia || "",
      numero: conta.numero || "",
      tipo: conta.tipo || "",
      moeda: conta.moeda || "BRL",
      saldo_inicial: conta.saldo_inicial || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await archive(id);
      toast.success("Conta bancária removida com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover conta");
    }
  };

  const getBancoInfo = (bancoId: string | null) => {
    if (!bancoId) return null;
    return bancos.find(b => b.id === bancoId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalContas = contas.length;
  const saldoTotal = contas.reduce((acc, conta) => acc + (conta.saldo_inicial || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total de Contas</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{totalContas}</p>
        </Card>

        <Card className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Saldo Total</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{formatCurrency(saldoTotal)}</p>
        </Card>

        <Card className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Bancos Vinculados</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{bancos.length}</p>
        </Card>
      </div>

      {/* Tabela de Contas */}
      <Card className="rounded-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Contas Bancárias</h2>
              <p className="text-sm text-gray-500 mt-1">Gerencie suas contas bancárias</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} className="rounded-lg gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Conta *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Conta Principal"
                      className={formErrors.nome ? "border-red-500" : ""}
                    />
                    {formErrors.nome && <p className="text-sm text-red-500">{formErrors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="banco">Banco *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddBankDialogOpen(true)}
                        className="h-8 px-2 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Banco
                      </Button>
                      {formData.banco_id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!user || !formData.banco_id) return;
                            try {
                              const { error } = await supabase
                                .from("bancos")
                                .delete()
                                .eq("id", formData.banco_id)
                                .eq("user_id", user.id);
                              if (error) throw error;
                              setFormData(prev => ({ ...prev, banco_id: "" }));
                              await fetchBancos();
                              toast.success("Banco removido");
                            } catch (err: any) {
                              toast.error(err.message || "Erro ao remover banco");
                            }
                          }}
                          className="h-8 px-2 text-xs"
                        >
                          Excluir Banco
                        </Button>
                      )}
                    </div>
                    {console.log('Renderizando SimpleSelect, bancos:', bancos?.length || 0, 'loadingBancos:', loadingBancos)}
                    <SimpleSelect
                      value={formData.banco_id}
                      onChange={(value) => setFormData({ ...formData, banco_id: value })}
                      placeholder={loadingBancos ? "Carregando bancos..." : "Selecione um banco"}
                      options={Array.isArray(bancos) ? bancos
                        .filter(banco => banco.user_id === user?.id)
                        .map(banco => ({ value: banco.id, label: banco.nome_curto })) : []}
                    />
                    {formErrors.banco_id && <p className="text-sm text-red-500">{formErrors.banco_id}</p>}
                    <div className="text-xs text-gray-500">
                      Total de bancos: {Array.isArray(bancos) ? bancos.filter(b => b.user_id === user?.id).length : 0} {loadingBancos && '(carregando...)'}
                    </div>
                    
                    
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agencia">Agência</Label>
                      <Input
                        id="agencia"
                        value={formData.agencia}
                        onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                        placeholder="Ex: 1234"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero">Número da Conta</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        placeholder="Ex: 56789-0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Conta</Label>
                      <CustomSelect
                        value={formData.tipo || ''}
                        onChange={(value) => setFormData({ ...formData, tipo: value })}
                        placeholder="Selecione o tipo"
                        options={TIPOS_CONTA.map(tipo => ({
                          value: tipo,
                          label: tipo
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="moeda">Moeda</Label>
                      <CustomSelect
                        value={formData.moeda}
                        onChange={(value) => setFormData({ ...formData, moeda: value })}
                        placeholder="Selecione a moeda"
                        options={MOEDAS.map(moeda => ({
                          value: moeda,
                          label: moeda
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saldo_inicial">Saldo Inicial</Label>
                    <Input
                      id="saldo_inicial"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.saldo_inicial}
                      onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
                      placeholder="0,00"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {isEditMode ? "Salvar Alterações" : "Criar Conta"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead>Saldo Inicial</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta) => {
                const bancoInfo = getBancoInfo(conta.banco_id);
                return (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">{conta.nome}</TableCell>
                    <TableCell>
                      {bancoInfo && (
                        <div className="flex items-center gap-2">
                          {bancoInfo.logo_url ? (
                            <img
                              src={bancoInfo.logo_url}
                              alt={bancoInfo.nome_curto}
                              className="w-5 h-5 rounded-sm object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div
                              className="w-5 h-5 rounded-sm flex items-center justify-center"
                              style={{ backgroundColor: bancoInfo.cor_primaria }}
                            >
                              <Building2 className="w-3 h-3 text-white/90" />
                            </div>
                          )}
                          <span>{bancoInfo.nome_curto}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{conta.agencia || "—"}</TableCell>
                    <TableCell>{conta.numero || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{conta.tipo || "Não definido"}</Badge>
                    </TableCell>
                    <TableCell>{conta.moeda || "BRL"}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(conta.saldo_inicial || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => openEditDialog(conta)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover a conta "{conta.nome}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(conta.id!)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {contas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    Nenhuma conta bancária encontrada.
                    <br />
                    <span className="text-sm">Clique em "Nova Conta" para começar.</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Botão de teste para debug */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={async () => {
            console.log('🧪 DEBUG: Testando banco simples...');
            try {
              const testBank = {
                nome_curto: "Banco Teste Simples",
                nome: "Banco Teste Simples S.A.",
                codigo: "555",
                cor_primaria: "#FF5733",
                ativo: true
              };
              
              console.log('Inserindo:', testBank);
              const { data, error } = await supabase
                .from("bancos")
                .insert([testBank])
                .select()
                .single();
              
              console.log('Resultado:', { data, error });
              
              if (error) {
                toast.error(`Erro: ${error.message}`);
              } else {
                toast.success('Banco teste inserido!');
                fetchBancos();
              }
            } catch (err) {
              console.error('Erro:', err);
              toast.error('Erro no teste');
            }
          }}
          className="bg-red-500 text-white text-xs px-2 py-1 h-8"
        >
          🧪 Test
        </Button>
      </div>

      {/* Dialog para adicionar novo banco */}
      <Dialog open={isAddBankDialogOpen} onOpenChange={setIsAddBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Banco</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddNewBank} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_curto">Nome Curto *</Label>
              <Input
                id="nome_curto"
                value={newBankData.nome_curto}
                onChange={(e) => setNewBankData({ ...newBankData, nome_curto: e.target.value })}
                placeholder="Ex: Banco do Brasil"
                className={newBankErrors.nome_curto ? "border-red-500" : ""}
              />
              {newBankErrors.nome_curto && <p className="text-sm text-red-500">{newBankErrors.nome_curto}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={newBankData.nome_completo}
                onChange={(e) => setNewBankData({ ...newBankData, nome_completo: e.target.value })}
                placeholder="Ex: Banco do Brasil S.A."
                className={newBankErrors.nome_completo ? "border-red-500" : ""}
              />
              {newBankErrors.nome_completo && <p className="text-sm text-red-500">{newBankErrors.nome_completo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código do Banco *</Label>
              <Input
                id="codigo"
                value={newBankData.codigo}
                onChange={(e) => setNewBankData({ ...newBankData, codigo: e.target.value })}
                placeholder="Ex: 001"
                className={newBankErrors.codigo ? "border-red-500" : ""}
              />
              {newBankErrors.codigo && <p className="text-sm text-red-500">{newBankErrors.codigo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor_primaria">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="cor_primaria"
                  type="color"
                  value={newBankData.cor_primaria}
                  onChange={(e) => setNewBankData({ ...newBankData, cor_primaria: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={newBankData.cor_primaria}
                  onChange={(e) => setNewBankData({ ...newBankData, cor_primaria: e.target.value })}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddBankDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Adicionar Banco
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
