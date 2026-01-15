import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, FolderOpen, User, Check, X, Save, ChevronLeft, ChevronRight, Instagram, ExternalLink, SearchX, ArrowLeft, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/utils/formatters";
import { ClienteStatusBadge } from "./ClienteStatusBadge";
import type { Cliente, ClienteComLTV } from "@/hooks/useClientes";

type ColKey = 'nome' | 'email' | 'telefone' | 'instagram' | 'cidade' | 'data_aniversario' | 'ltv' | 'categoria' | 'indicado_por' | 'indicados' | 'projetos' | 'acoes';

interface ClienteTableProps {
  clientes: ClienteComLTV[];
  sortedClientes: ClienteComLTV[];
  maxLTV: number;
  editingRows: Set<string>;
  editedData: Record<string, Partial<Cliente>>;
  visibleCols: Record<ColKey, boolean>;
  startEditing: (clienteId: string, cliente: Cliente) => void;
  cancelEditing: (clienteId: string) => void;
  saveEdit: (clienteId: string) => void;
  updateEditedData: (clienteId: string, field: keyof Cliente, value: string) => void;
  saveAllEdits: () => void;
  deleteCliente: (id: string) => void;
}

export function ClienteTable({
  clientes,
  sortedClientes,
  maxLTV,
  editingRows,
  editedData,
  visibleCols,
  startEditing,
  cancelEditing,
  saveEdit,
  updateEditedData,
  saveAllEdits,
  deleteCliente
}: ClienteTableProps) {
  const navigate = useNavigate();
  const { colorTheme } = useTheme();

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [isTableVisible50, setIsTableVisible50] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedClientes.length / itemsPerPage);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortedClientes.length]);

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
    const init = () => updateArrowVisibility();
    const onScroll = () => updateArrowVisibility();
    const onResize = () => updateArrowVisibility();
    const t = setTimeout(init, 120);
    if (el) el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      if (el) el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [sortedClientes.length]);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) {
      setIsTableVisible50(false);
      return undefined;
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
  }, []);

  const handleKeyDownSave = (clienteId: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(clienteId);
    }
  };

  const handleKeyDownSaveDefer = (clienteId: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setTimeout(() => saveEdit(clienteId), 0);
    }
  };

  const strongAccentThemes = ["ocean", "sunset", "forest", "purple", "rose"];
  const hoverClass = strongAccentThemes.includes(colorTheme) ? "hover:bg-muted/20" : "hover:bg-muted/30";

  if (sortedClientes.length === 0) {
    return (
      <Card className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-xl border-dashed">
        <div className="p-4 bg-muted/30 rounded-full mb-4">
          <SearchX className="w-12 h-12 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum cliente encontrado</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Não conseguimos encontrar nenhum cliente com os filtros atuais. Tente mudar os termos da busca.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {editingRows.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
          <p className="text-sm flex-1">
            {editingRows.size} linha(s) em edição
          </p>
          <Button size="sm" className="rounded-xl gap-2" onClick={saveAllEdits}>
            <Save className="w-4 h-4" />
            Salvar Todas
          </Button>
        </div>
      )}

      <Card className="rounded-xl overflow-hidden relative" ref={tableContainerRef}>
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
                  {visibleCols.data_aniversario && <TableHead className="min-w-[120px]">Aniversário</TableHead>}
                  {visibleCols.ltv && <TableHead className="min-w-[150px]">LTV</TableHead>}
                  {visibleCols.categoria && <TableHead className="min-w-[120px]">Categoria</TableHead>}
                  {visibleCols.indicado_por && <TableHead className="min-w-[180px]">Indicado por</TableHead>}
                  {visibleCols.indicados && <TableHead className="min-w-[200px]">Indicados</TableHead>}
                  {visibleCols.projetos && <TableHead className="min-w-[120px]">Projetos</TableHead>}
                  {visibleCols.acoes && <TableHead className="text-right min-w-[190px] sticky right-0 bg-background z-10">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(cliente => {
                  const isEditing = editingRows.has(cliente.id);
                  const editData = editedData[cliente.id] || cliente;

                  return (
                    <TableRow
                      key={cliente.id}
                      className={`${isEditing ? "bg-muted/50 " : ""}cursor-pointer ${hoverClass} transition-colors`}
                      onClick={(e) => {
                        if (!isEditing && window.getSelection()?.toString().length === 0) {
                          navigate(`/clientes/${cliente.id}`);
                        }
                      }}
                    >
                      {visibleCols.nome && (
                        <TableCell className="py-3">
                          {isEditing ? (
                            <Input
                              value={editData.nome}
                              onChange={e => updateEditedData(cliente.id, 'nome', e.target.value)}
                              onKeyDown={handleKeyDownSave(cliente.id)}
                              className="rounded-xl h-8"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <Dialog>
                                <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Avatar className={`h-9 w-9 border border-border ${cliente.foto_url ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}>
                                    <AvatarImage src={cliente.foto_url} alt={cliente.nome} />
                                    <AvatarFallback className="text-xs font-semibold text-primary/80 bg-primary/5">
                                      {cliente.nome
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </DialogTrigger>
                                {cliente.foto_url && (
                                  <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none outline-none">
                                    <img
                                      src={cliente.foto_url}
                                      alt={cliente.nome}
                                      className="w-full h-auto rounded-lg shadow-2xl object-cover"
                                    />
                                  </DialogContent>
                                )}
                              </Dialog>
                              <span className="font-medium">{cliente.nome}</span>
                            </div>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.email && (
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="email"
                              value={editData.email}
                              onChange={e => updateEditedData(cliente.id, 'email', e.target.value)}
                              onKeyDown={handleKeyDownSave(cliente.id)}
                              className="rounded-xl h-8"
                            />
                          ) : (
                            <span className="text-muted-foreground">{cliente.email}</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.telefone && (
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editData.telefone}
                              onChange={e => updateEditedData(cliente.id, 'telefone', e.target.value)}
                              onKeyDown={handleKeyDownSave(cliente.id)}
                              className="rounded-xl h-8"
                            />
                          ) : (
                            <span className="text-muted-foreground">{cliente.telefone}</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.instagram && (
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={(editData as any).instagram || ''}
                              onChange={e => updateEditedData(cliente.id, 'instagram' as any, e.target.value)}
                              onKeyDown={handleKeyDownSave(cliente.id)}
                              className="rounded-xl h-8"
                            />
                          ) : cliente.instagram ? (
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:text-pink-600 hover:bg-pink-50" asChild onClick={(e) => e.stopPropagation()}>
                              <a href={cliente.instagram} target="_blank" rel="noreferrer" title={cliente.instagram}>
                                <Instagram className="w-4 h-4 mr-2" />
                                <span className="text-xs">Perfil</span>
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.cidade && (
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={(editData as any).cidade || ''}
                              onChange={e => updateEditedData(cliente.id, 'cidade' as any, e.target.value)}
                              onKeyDown={handleKeyDownSave(cliente.id)}
                              className="rounded-xl h-8"
                            />
                          ) : ((cliente as any).cidades && (cliente as any).cidades.length > 0) ? (
                            <Badge variant="outline" className="font-normal text-muted-foreground">{(cliente as any).cidades.join(', ')}</Badge>
                          ) : cliente.cidade ? (
                            <Badge variant="outline" className="font-normal text-muted-foreground">{cliente.cidade}</Badge>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.data_aniversario && (
                        <TableCell>
                          {cliente.data_aniversario ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(cliente.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.ltv && (
                        <TableCell>
                          <span className="font-semibold text-success">
                            {formatCurrency(cliente.ltv)}
                          </span>
                        </TableCell>
                      )}
                      {visibleCols.categoria && (
                        <TableCell>
                          <ClienteStatusBadge status={cliente.status} />
                        </TableCell>
                      )}
                      {visibleCols.indicado_por && (
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editData.indicado_por || "none"}
                              onValueChange={value => updateEditedData(cliente.id, 'indicado_por', value === "none" ? "" : value)}
                            >
                              <SelectTrigger className="rounded-xl h-8 text-xs" onKeyDown={handleKeyDownSaveDefer(cliente.id)}>
                                <SelectValue placeholder="Selecionar indicador" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl" onKeyDown={handleKeyDownSaveDefer(cliente.id)}>
                                <SelectItem value="none">Nenhum (cliente direto)</SelectItem>
                                {clientes.filter(c => c.id !== cliente.id).map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : cliente.indicado_por ? (
                            <Badge variant="secondary" className="rounded-full text-xs">
                              {clientes.find(c => c.id === cliente.indicado_por)?.nome || 'Cliente não encontrado'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Cliente direto</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.indicados && (
                        <TableCell>
                          {(() => {
                            const indicados = clientes.filter(c => c.indicado_por === cliente.id);
                            if (indicados.length === 0) return <span className="text-xs text-muted-foreground italic">Nenhum</span>;
                            const nomes = indicados.map(i => i.nome).join(', ');
                            return <span className="text-sm" title={nomes}>{indicados.length} cliente(s)</span>;
                          })()}
                        </TableCell>
                      )}
                      {visibleCols.projetos && (
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            <div>{cliente.projetos_count} projeto(s)</div>
                            <div className="text-xs">{cliente.transacoes_count} transação(ões)</div>
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.acoes && (
                        <TableCell className="text-right sticky right-0 bg-background z-10 min-w-[190px]">
                          <div className="flex gap-1 justify-end relative z-20">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl text-success hover:bg-success/10"
                                  onClick={() => saveEdit(cliente.id)}
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl hover:bg-muted/40"
                                  onClick={() => cancelEditing(cliente.id)}
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl hover:bg-muted/40 hover:text-foreground"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/projetos?cliente=${cliente.id}`); }}
                                  title="Ver projetos"
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl hover:bg-muted/40 hover:text-foreground"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${cliente.id}`); }}
                                  title="Ver perfil"
                                >
                                  <User className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl hover:bg-muted/40 hover:text-foreground"
                                  onClick={(e) => { e.stopPropagation(); startEditing(cliente.id, cliente); }}
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10"
                                  onClick={(e) => { e.stopPropagation(); deleteCliente(cliente.id); }}
                                  title="Deletar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Pagination Controls */}
      {
        totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedClientes.length)}</span> de <span className="font-medium">{sortedClientes.length}</span> clientes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      }

      {/* Scroll arrows overlay */}
      {
        isTableVisible50 && (
          <>
            {showLeftArrow && (
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/40 shadow-lg backdrop-blur-md"
                onClick={() => tableScrollRef.current?.scrollBy({ left: -480, behavior: 'smooth' })}
                title="Rolar para a esquerda"
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
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </>
        )
      }
    </div >
  );
}

