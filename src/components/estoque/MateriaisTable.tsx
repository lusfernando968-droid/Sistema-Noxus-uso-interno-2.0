import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight
} from "lucide-react";

export default function MateriaisTable() {
  const { items, insert, update, remove } = useMateriaisEstoque();

  // Filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Ordenação
  const [sortColumn, setSortColumn] = useState<keyof MaterialRecord | "total">("data_aquisicao");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados de edição/exclusão
  const [editing, setEditing] = useState<MaterialRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MaterialRecord | null>(null);

  // Tipos únicos para o filtro
  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map(i => i.tipo_material).filter(Boolean));
    return Array.from(types).sort();
  }, [items]);

  // Filtragem e Ordenação
  const filteredAndSorted = useMemo(() => {
    let result = items.filter((i) => {
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
  }, [items, search, typeFilter, sortColumn, sortDirection]);

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
      {/* Toolbar de Filtros */}
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
          onSubmit={async (v) => { await insert(v); }}
        />
      </div>

      {/* Tabela */}
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
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Nenhum material encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((m) => (
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
                      {Number(m.quantidade).toLocaleString("pt-BR")} <span className="text-xs text-muted-foreground">{m.unidade}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(m.custo_unitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(Number(m.quantidade) * Number(m.custo_unitario)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

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
    </div>
  );
}
