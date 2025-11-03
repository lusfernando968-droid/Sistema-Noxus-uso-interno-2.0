import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useToastWithSound } from "@/hooks/useToastWithSound";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";

// Interfaces
interface ItemEstoque {
  id: string;
  nome: string;
  categoria: 'tintas' | 'agulhas' | 'descartaveis' | 'equipamentos' | 'higiene';
  marca: string;
  quantidade: number;
  preco_unitario: number;
  data_validade?: string;
  fornecedor: string;
  localizacao: string;
  cor?: string; // Para tintas
  tamanho?: string; // Para agulhas
}

interface Movimentacao {
  id: string;
  item_id: string;
  tipo: 'entrada' | 'saida' | 'baixa' | 'ajuste';
  quantidade: number;
  data: string;
  observacoes: string;
  bancada_id?: string;
}

interface Bancada {
  id: string;
  nome: string;
  tatuador: string;
  ativa: boolean;
  custo_sessao_atual: number;
  total_sessoes: number;
  custo_total_acumulado: number;
}

export default function Estoque() {
  const { toast } = useToastWithSound();
  const { playSound } = useSoundEffects();
  const { checkEstoqueMilestone } = useAchievementNotifications();

  // Estados principais
  const [itensEstoque, setItensEstoque] = useState<ItemEstoque[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [bancadas, setBancadas] = useState<Bancada[]>([]);

  // Estados de filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  // Estados de formulários
  const [isDialogItemOpen, setIsDialogItemOpen] = useState(false);
  const [isDialogMovimentacaoOpen, setIsDialogMovimentacaoOpen] = useState(false);
  const [isDialogBancadaOpen, setIsDialogBancadaOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemEstoque | null>(null);
  const [editingBancada, setBancada] = useState<Bancada | null>(null);

  const [formDataItem, setFormDataItem] = useState<{
    nome: string;
    categoria: 'tintas' | 'agulhas' | 'descartaveis' | 'equipamentos' | 'higiene';
    marca: string;
    quantidade: number;
    preco_unitario: number;
    data_validade: string;
    fornecedor: string;
    localizacao: string;
    cor: string;
    tamanho: string;
  }>({
    nome: "",
    categoria: "tintas",
    marca: "",
    quantidade: 0,
    preco_unitario: 0,
    data_validade: "",
    fornecedor: "",
    localizacao: "",
    cor: "",
    tamanho: ""
  });

  const [formDataMovimentacao, setFormDataMovimentacao] = useState({
    item_id: "",
    tipo: "entrada" as const,
    quantidade: 0,
    observacoes: "",
    bancada_id: ""
  });

  const [formDataBancada, setFormDataBancada] = useState({
    nome: "",
    tatuador: "",
    ativa: true
  });

  // Dados simulados iniciais
  useEffect(() => {
    const itensIniciais: ItemEstoque[] = [
      {
        id: "1",
        nome: "Tinta Preta",
        categoria: "tintas",
        marca: "World Famous",
        quantidade: 15,
        preco_unitario: 25.00,
        fornecedor: "Tattoo Supply",
        localizacao: "Prateleira A1",
        cor: "Preto"
      },
      {
        id: "2", 
        nome: "Agulha 3RL",
        categoria: "agulhas",
        marca: "Cheyenne",
        quantidade: 50,
        preco_unitario: 3.50,
        fornecedor: "Tattoo Supply",
        localizacao: "Gaveta B2",
        tamanho: "3RL"
      }
    ];

    const bancadasIniciais: Bancada[] = [
      {
        id: "1",
        nome: "Bancada Principal",
        tatuador: "João Silva",
        ativa: true,
        custo_sessao_atual: 67.50,
        total_sessoes: 45,
        custo_total_acumulado: 2850.00
      },
      {
        id: "2",
        nome: "Bancada Secundária", 
        tatuador: "Maria Santos",
        ativa: false,
        custo_sessao_atual: 0.00,
        total_sessoes: 32,
        custo_total_acumulado: 1920.00
      }
    ];

    setItensEstoque(itensIniciais);
    setBancadas(bancadasIniciais);
    
    // Verifica meta de estoque
    checkEstoqueMilestone(itensIniciais.length);
  }, [checkEstoqueMilestone]);

  // Funções auxiliares
  const getStatusItem = (item: ItemEstoque) => {
    if (item.quantidade === 0) return 'esgotado';
    if (item.quantidade <= 5) return 'baixo';
    return 'disponivel';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'baixo': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'esgotado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'baixo': return 'Baixo Estoque';
      case 'esgotado': return 'Esgotado';
      default: return 'Desconhecido';
    }
  };

  // Filtros
  const itensFiltrados = itensEstoque.filter(item => {
    const matchCategoria = filtroCategoria === 'todos' || item.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todos' || getStatusItem(item) === filtroStatus;
    const matchBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      item.marca.toLowerCase().includes(busca.toLowerCase());
    
    return matchCategoria && matchStatus && matchBusca;
  });

  // Métricas
  const totalItens = itensEstoque.length;
  const itensDisponiveis = itensEstoque.filter(item => getStatusItem(item) === 'disponivel').length;
  const itensBaixoEstoque = itensEstoque.filter(item => getStatusItem(item) === 'baixo').length;
  const itensEsgotados = itensEstoque.filter(item => getStatusItem(item) === 'esgotado').length;
  const valorTotalEstoque = itensEstoque.reduce((total, item) => total + (item.quantidade * item.preco_unitario), 0);

  // Handlers
  const handleSubmitItem = () => {
    playSound('click');
    
    if (editingItem) {
      // Editando item existente
      const itemAtualizado: ItemEstoque = {
        ...editingItem,
        ...formDataItem
      };
      setItensEstoque(prev => prev.map(item => item.id === editingItem.id ? itemAtualizado : item));
      toast({ title: "Item atualizado com sucesso!" });
    } else {
      // Criando novo item
      const novoItem: ItemEstoque = {
        id: Date.now().toString(),
        ...formDataItem
      };
      setItensEstoque(prev => {
        const novosItens = [...prev, novoItem];
        checkEstoqueMilestone(novosItens.length);
        return novosItens;
      });
      toast({ title: "Item adicionado ao estoque!" });
    }

    setIsDialogItemOpen(false);
    setEditingItem(null);
    setFormDataItem({
      nome: "",
      categoria: "tintas",
      marca: "",
      quantidade: 0,
      preco_unitario: 0,
      data_validade: "",
      fornecedor: "",
      localizacao: "",
      cor: "",
      tamanho: ""
    });
  };

  const handleEditItem = (item: ItemEstoque) => {
    playSound('click');
    setEditingItem(item);
    setFormDataItem({
      nome: item.nome,
      categoria: item.categoria,
      marca: item.marca,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      data_validade: item.data_validade || "",
      fornecedor: item.fornecedor,
      localizacao: item.localizacao,
      cor: item.cor || "",
      tamanho: item.tamanho || ""
    });
    setIsDialogItemOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    playSound('click');
    setItensEstoque(prev => prev.filter(item => item.id !== id));
    toast({ title: "Item removido do estoque!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="w-8 h-8" />
              Controle de Estoque
            </h1>
            <p className="text-muted-foreground">
              Gerencie materiais de tatuagem, bancadas e custos
            </p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold">{totalItens}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Disponíveis</p>
                  <p className="text-2xl font-bold text-green-500">{itensDisponiveis}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Baixo Estoque</p>
                  <p className="text-2xl font-bold text-yellow-500">{itensBaixoEstoque}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Esgotados</p>
                  <p className="text-2xl font-bold text-red-500">{itensEsgotados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-500">R$ {valorTotalEstoque.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="estoque" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl">
            <TabsTrigger value="estoque" className="rounded-xl">Estoque</TabsTrigger>
            <TabsTrigger value="movimentacoes" className="rounded-xl">Movimentações</TabsTrigger>
            <TabsTrigger value="bancadas" className="rounded-xl">Bancadas</TabsTrigger>
            <TabsTrigger value="metricas" className="rounded-xl">Métricas</TabsTrigger>
          </TabsList>

          {/* Aba Estoque */}
          <TabsContent value="estoque" className="space-y-6">
            {/* Filtros e Busca */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por nome ou marca..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="w-full md:w-48 rounded-xl">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas Categorias</SelectItem>
                      <SelectItem value="tintas">Tintas</SelectItem>
                      <SelectItem value="agulhas">Agulhas</SelectItem>
                      <SelectItem value="descartaveis">Descartáveis</SelectItem>
                      <SelectItem value="equipamentos">Equipamentos</SelectItem>
                      <SelectItem value="higiene">Higiene</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-full md:w-48 rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Status</SelectItem>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="baixo">Baixo Estoque</SelectItem>
                      <SelectItem value="esgotado">Esgotado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={isDialogItemOpen} onOpenChange={setIsDialogItemOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => playSound('click')} className="rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Item" : "Adicionar Novo Item"}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={formDataItem.nome}
                            onChange={(e) => setFormDataItem(prev => ({ ...prev, nome: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <Label>Categoria</Label>
                          <Select value={formDataItem.categoria} onValueChange={(value: any) => setFormDataItem(prev => ({ ...prev, categoria: value }))}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tintas">Tintas</SelectItem>
                              <SelectItem value="agulhas">Agulhas</SelectItem>
                              <SelectItem value="descartaveis">Descartáveis</SelectItem>
                              <SelectItem value="equipamentos">Equipamentos</SelectItem>
                              <SelectItem value="higiene">Higiene</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Marca</Label>
                          <Input
                            value={formDataItem.marca}
                            onChange={(e) => setFormDataItem(prev => ({ ...prev, marca: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            value={formDataItem.quantidade}
                            onChange={(e) => setFormDataItem(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <Label>Preço Unitário</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formDataItem.preco_unitario}
                            onChange={(e) => setFormDataItem(prev => ({ ...prev, preco_unitario: parseFloat(e.target.value) || 0 }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <Label>Fornecedor</Label>
                          <Input
                            value={formDataItem.fornecedor}
                            onChange={(e) => setFormDataItem(prev => ({ ...prev, fornecedor: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <Label>Localização</Label>
                          <Input
                            value={formDataItem.localizacao}
                            onChange={(e) => setFormDataItem(prev => ({ ...prev, localizacao: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        {formDataItem.categoria === 'tintas' && (
                          <div>
                            <Label>Cor</Label>
                            <Input
                              value={formDataItem.cor}
                              onChange={(e) => setFormDataItem(prev => ({ ...prev, cor: e.target.value }))}
                              className="rounded-xl"
                            />
                          </div>
                        )}
                        {formDataItem.categoria === 'agulhas' && (
                          <div>
                            <Label>Tamanho</Label>
                            <Input
                              value={formDataItem.tamanho}
                              onChange={(e) => setFormDataItem(prev => ({ ...prev, tamanho: e.target.value }))}
                              className="rounded-xl"
                              placeholder="Ex: 3RL, 5RS, 7M1"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => {
                          playSound('click');
                          setIsDialogItemOpen(false);
                          setEditingItem(null);
                        }} className="rounded-xl">
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmitItem} className="rounded-xl">
                          {editingItem ? "Atualizar" : "Adicionar"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Itens */}
            <Card className="rounded-2xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensFiltrados.map((item) => {
                      const status = getStatusItem(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.nome}</p>
                              <p className="text-sm text-muted-foreground">{item.marca}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-xl capitalize">
                              {item.categoria}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.quantidade}</TableCell>
                          <TableCell>R$ {item.preco_unitario.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-xl ${getStatusColor(status)}`}>
                              {getStatusLabel(status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditItem(item)}
                                className="rounded-xl"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded-xl text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outras abas podem ser implementadas aqui */}
          <TabsContent value="movimentacoes">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p>Funcionalidade de movimentações em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bancadas">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p>Funcionalidade de bancadas em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metricas">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p>Métricas e relatórios em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}