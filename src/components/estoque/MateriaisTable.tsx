import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MaterialFormDialog from "./MaterialFormDialog";
import { useMateriaisEstoque, MaterialRecord } from "@/hooks/useMateriaisEstoque";
import {
  MoreHorizontal,
  ArrowUpDown,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Archive
} from "lucide-react";

export default function MateriaisTable() {
  const { items, insert, update, remove, darBaixa } = useMateriaisEstoque();

  // Filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"estoque" | "finalizados">("estoque");

  // Ordenação
  const [sortColumn, setSortColumn] = useState<keyof MaterialRecord | "total">("data_aquisicao");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados de edição/exclusão
  const [editing, setEditing] = useState<MaterialRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MaterialRecord | null>(null);
  const [baixaDialog, setBaixaDialog] = useState<MaterialRecord | null>(null);
  const [dataBaixa, setDataBaixa] = useState(new Date().toISOString().split('T')[0]);
  const [baixaPorEmbalagem, setBaixaPorEmbalagem] = useState(false);
  const [qtdEmbalagensBaixa, setQtdEmbalagensBaixa] = useState(1);

  // Tipos únicos para o filtro
  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map(i => i.tipo_material).filter(Boolean));
    return Array.from(types).sort();
  }, [items]);

  // Filtragem e Ordenação
  const filteredAndSorted = useMemo(() => {
    let result = items.filter((i) => {
      // Filtro por Aba
      if (activeTab === "estoque" && i.data_esgotamento) return false;
      if (activeTab === "finalizados" && !i.data_esgotamento) return false;

      const matchesSearch =
        i.nome.toLowerCase().includes(search.toLowerCase()) ||
        i.marca?.toLowerCase().includes(search.toLowerCase()) ||
        i.fornecedor?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || i.tipo_material === typeFilter;

      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      let valA: any = a[sortColumn as keyof MaterialRecord];
      let valB: any = b[sortColumn as keyof MaterialRecord];

      if (sortColumn === "total") {
        valA = (Number(a.quantidade) || 0) * (Number(a.custo_unitario) || 0);
        valB = (Number(b.quantidade) || 0) * (Number(b.custo_unitario) || 0);
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, search, typeFilter, sortColumn, sortDirection, activeTab]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedItems = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: keyof MaterialRecord | "total") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
          <TabsTrigger value="estoque">Em Estoque</TabsTrigger>
          <TabsTrigger value="finalizados">Finalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4 m-0">
          {/* Toolbar de Filtros - Estoque */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, marca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {uniqueTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(search || typeFilter !== "all") && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <MaterialFormDialog
              trigger={<Button className="w-full md:w-auto">Adicionar Material</Button>}
              initial={null}
              onSubmit={async (v, opts) => { await insert(v, opts); }}
            />
          </div>

          <MateriaisList
            items={paginatedItems}
            handleSort={handleSort}
            setEditing={setEditing}
            setBaixaDialog={setBaixaDialog}
            setDataBaixa={setDataBaixa}
            setConfirmDelete={setConfirmDelete}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            showBaixaOption={true}
          />
        </TabsContent>

        <TabsContent value="finalizados" className="space-y-4 m-0">
          {/* Toolbar de Filtros - Finalizados */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, marca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {uniqueTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(search || typeFilter !== "all") && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* No Add Button for Finalizados */}
          </div>

          <MateriaisList
            items={paginatedItems}
            handleSort={handleSort}
            setEditing={setEditing}
            setBaixaDialog={setBaixaDialog}
            setDataBaixa={setDataBaixa}
            setConfirmDelete={setConfirmDelete}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            showBaixaOption={false}
          />
        </TabsContent>
      </Tabs>


      {/* Dialogs */}
      {editing && (
        <MaterialFormDialog
          initial={editing}
          open={!!editing}
          onOpenChange={(o) => { if (!o) setEditing(null); }}
          onSubmit={async (v) => {
            if (editing?.id) await update(editing.id, v);
            setEditing(null);
          }}
        />
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir material</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Tem certeza que deseja excluir <strong>{confirmDelete?.nome}</strong>?
            <br />
            <span className="text-sm text-muted-foreground">Essa ação não pode ser desfeita.</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmDelete?.id) await remove(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!baixaDialog} onOpenChange={(o) => !o && setBaixaDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar Baixa em Material</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Opção de baixa por embalagem */}
            {baixaDialog?.unidade_embalagem && baixaDialog?.fator_conversao && baixaDialog?.quantidade_embalagens && (
              <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-md">
                <Checkbox
                  id="baixa-embalagem"
                  checked={baixaPorEmbalagem}
                  onCheckedChange={(checked) => {
                    setBaixaPorEmbalagem(!!checked);
                    setQtdEmbalagensBaixa(1);
                  }}
                />
                <label htmlFor="baixa-embalagem" className="text-sm font-medium cursor-pointer">
                  Dar baixa por {baixaDialog.unidade_embalagem}
                </label>
              </div>
            )}

            {baixaPorEmbalagem && baixaDialog?.unidade_embalagem ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantidade de {baixaDialog.unidade_embalagem}s</label>
                  <Input
                    type="number"
                    min="1"
                    max={Number(baixaDialog.quantidade_embalagens)}
                    value={qtdEmbalagensBaixa}
                    onChange={(e) => setQtdEmbalagensBaixa(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Disponível: {Number(baixaDialog.quantidade_embalagens).toLocaleString("pt-BR")} {baixaDialog.unidade_embalagem}s
                  </p>
                  <p className="text-sm font-medium text-primary">
                    Será dado baixa em: {qtdEmbalagensBaixa} × {Number(baixaDialog.fator_conversao).toLocaleString("pt-BR")} = {qtdEmbalagensBaixa * Number(baixaDialog.fator_conversao)} {baixaDialog.unidade}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data da Baixa</label>
                  <Input
                    type="date"
                    value={dataBaixa}
                    onChange={(e) => setDataBaixa(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  Confirmar o fim do estoque de <strong>{baixaDialog?.nome}</strong>?
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Esgotamento</label>
                  <Input
                    type="date"
                    value={dataBaixa}
                    onChange={(e) => setDataBaixa(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Será calculada a duração desde a data de aquisição ({baixaDialog?.data_aquisicao && new Date(baixaDialog.data_aquisicao).toLocaleDateString("pt-BR")}).
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBaixaDialog(null)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (baixaDialog?.id) {
                  if (baixaPorEmbalagem && baixaDialog.fator_conversao) {
                    // Baixa parcial: reduzir quantidade
                    const qtdBaixa = qtdEmbalagensBaixa * Number(baixaDialog.fator_conversao);
                    const novaQtd = Number(baixaDialog.quantidade) - qtdBaixa;
                    const novaQtdEmb = Number(baixaDialog.quantidade_embalagens) - qtdEmbalagensBaixa;

                    await update(baixaDialog.id, {
                      ...baixaDialog,
                      quantidade: novaQtd,
                      quantidade_embalagens: novaQtdEmb,
                      data_esgotamento: novaQtd <= 0 ? dataBaixa : null
                    });
                  } else {
                    // Baixa total
                    await darBaixa(baixaDialog.id, dataBaixa);
                  }
                }
                setBaixaDialog(null);
                setBaixaPorEmbalagem(false);
                setQtdEmbalagensBaixa(1);
              }}
            >
              {baixaPorEmbalagem ? "Confirmar Baixa Parcial" : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subcomponente para renderizar a lista
function MateriaisList({
  items,
  handleSort,
  setEditing,
  setBaixaDialog,
  setDataBaixa,
  setConfirmDelete,
  totalPages,
  currentPage,
  setCurrentPage,
  showBaixaOption
}: any) {
  return (
    <Card className="rounded-xl border shadow-sm overflow-hidden">
      <CardHeader className="px-6 py-4 border-b bg-muted/40">
        <CardTitle className="text-lg">Lista de Materiais</CardTitle>
        <CardDescription>Gerencie o inventário do estúdio.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("data_aquisicao")}>
                  Data
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("nome")}>
                  Nome
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Marca</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Custo Un.</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleSort("total")}>
                  Total
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhum material encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((m: any) => (
                <TableRow key={m.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {new Date(m.data_aquisicao).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize font-normal">
                      {m.tipo_material}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{m.marca || "-"}</TableCell>
                  <TableCell className="text-right">
                    {m.data_esgotamento ? (
                      <Badge variant="outline" className="text-muted-foreground border-dashed">Esgotado</Badge>
                    ) : (
                      <div className="flex flex-col items-end gap-0.5">
                        {m.unidade_embalagem && m.fator_conversao && m.quantidade_embalagens ? (
                          <>
                            <div className="font-medium">
                              {Number(m.quantidade_embalagens).toLocaleString("pt-BR")} {m.unidade_embalagem}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Number(m.fator_conversao).toLocaleString("pt-BR")} {m.unidade}/{m.unidade_embalagem} = {Number(m.quantidade).toLocaleString("pt-BR")} {m.unidade}
                            </div>
                          </>
                        ) : (
                          <>
                            {Number(m.quantidade).toLocaleString("pt-BR")} <span className="text-xs text-muted-foreground">{m.unidade}</span>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(Number(m.custo_unitario) || 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(m.quantidade) || 0) * (Number(m.custo_unitario) || 0))}
                    {m.data_esgotamento && (() => {
                      const diff = Math.ceil(Math.abs(new Date(m.data_esgotamento).getTime() - new Date(m.data_aquisicao).getTime()) / (1000 * 60 * 60 * 24));
                      return <div className="text-xs text-muted-foreground font-normal">Durou {diff} dias</div>
                    })()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditing(m)}>
                          Editar
                        </DropdownMenuItem>
                        {showBaixaOption && !m.data_esgotamento && (
                          <DropdownMenuItem onClick={() => {
                            setBaixaDialog(m);
                            setDataBaixa(new Date().toISOString().split('T')[0]);
                          }}>
                            <Archive className="mr-2 h-4 w-4" /> Dar Baixa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmDelete(m)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 p-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground mr-4">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
