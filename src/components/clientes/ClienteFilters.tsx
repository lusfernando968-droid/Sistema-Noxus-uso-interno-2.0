import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, EyeOff } from "lucide-react";
import type { FiltrosClientes, CidadeOption, ClienteComLTV } from "@/hooks/useClientes";
import { useState, useMemo } from "react";

interface ClienteFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filtros: FiltrosClientes;
  setFiltros: (filtros: FiltrosClientes) => void;
  resetFilters: () => void;
  activeFiltersCount: number;
  clientes: ClienteComLTV[];
  availableCities: CidadeOption[];
  cityUsageCounts: Record<string, number>;
  visibleCols: Record<string, boolean>;
  toggleCol: (key: string) => void;
  colLabels: Record<string, string>;
  sortBy: "nome" | "ltv" | "created_at";
  setSortBy: (sort: "nome" | "ltv" | "created_at") => void;
  filteredCount: number;
  children?: React.ReactNode; // Slot for additional actions (e.g., New Client button)
}

export function ClienteFilters({
  searchTerm,
  setSearchTerm,
  filtros,
  setFiltros,
  resetFilters,
  activeFiltersCount,
  clientes,
  availableCities,
  cityUsageCounts,
  visibleCols,
  toggleCol,
  colLabels,
  sortBy,
  setSortBy,
  filteredCount,
  children
}: ClienteFiltersProps) {
  const [filterCityQuery, setFilterCityQuery] = useState("");
  const [cityRankingMode, setCityRankingMode] = useState<"mais_usadas" | "mais_recentes">("mais_usadas");

  const getRankedCities = useMemo(() => {
    const excludeLower = filtros.cidades.map(c => (c || "").toLowerCase());
    const filtered = availableCities.filter(c => {
      const notExcluded = !excludeLower.includes((c.nome || "").toLowerCase());
      const matchesQuery = filterCityQuery ? (c.nome.toLowerCase().includes(filterCityQuery.toLowerCase())) : true;
      return notExcluded && matchesQuery;
    });

    const byUsage = (name: string) => cityUsageCounts[name] || 0;
    const toTime = (c: CidadeOption) => c.created_at ? new Date(c.created_at).getTime() : 0;

    const sorted = [...filtered].sort((a, b) => {
      if (cityRankingMode === "mais_usadas") {
        const ua = byUsage(a.nome);
        const ub = byUsage(b.nome);
        if (ub !== ua) return ub - ua;
        const tb = toTime(b) - toTime(a);
        if (tb !== 0) return tb;
        return a.nome.localeCompare(b.nome);
      } else {
        const tb = toTime(b) - toTime(a);
        if (tb !== 0) return tb;
        const ua = byUsage(a.nome);
        const ub = byUsage(b.nome);
        if (ub !== ua) return ub - ua;
        return a.nome.localeCompare(b.nome);
      }
    });

    return sorted.slice(0, 8);
  }, [availableCities, filtros.cidades, filterCityQuery, cityRankingMode, cityUsageCounts]);

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1 mb-4">
      <div className="flex items-center gap-3 flex-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar clientes..." 
            className="pl-10 rounded-lg border-muted/50 bg-background/50 backdrop-blur-sm h-9" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-lg h-9">
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[520px] rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cidades */}
              <div className="space-y-2">
                <Label>Cidades</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {filtros.cidades.map((nome) => (
                    <Badge key={nome} variant="secondary" className="rounded-full px-2 py-1 text-xs">
                      <span>{nome}</span>
                      <button
                        type="button"
                        onClick={() => setFiltros({ 
                          ...filtros, 
                          cidades: filtros.cidades.filter(c => c.toLowerCase() !== nome.toLowerCase()) 
                        })}
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
                  <Button 
                    type="button" 
                    variant={cityRankingMode === "mais_usadas" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-6 rounded-full px-2"
                    onClick={() => setCityRankingMode("mais_usadas")}
                  >
                    Mais usadas
                  </Button>
                  <Button 
                    type="button" 
                    variant={cityRankingMode === "mais_recentes" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-6 rounded-full px-2"
                    onClick={() => setCityRankingMode("mais_recentes")}
                  >
                    Mais recentes
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getRankedCities.map(c => (
                    <Button 
                      key={c.id || c.nome} 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full h-7"
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

              {/* Instagram */}
              <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={filtros.hasInstagram} 
                    onCheckedChange={v => setFiltros({ ...filtros, hasInstagram: Boolean(v) })} 
                  />
                  <span className="text-sm text-muted-foreground">Somente quem tem link</span>
                </div>
              </div>

              {/* LTV */}
              <div className="space-y-2">
                <Label>LTV mínimo</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={filtros.ltvMin} 
                  onChange={e => setFiltros({ ...filtros, ltvMin: Number(e.target.value || 0) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>LTV máximo</Label>
                <Input 
                  type="number" 
                  min={0} 
                  placeholder="Sem limite" 
                  value={filtros.ltvMax || ""} 
                  onChange={e => setFiltros({ ...filtros, ltvMax: Number(e.target.value || 0) })} 
                />
              </div>

              {/* Datas */}
              <div className="space-y-2">
                <Label>Data início</Label>
                <Input 
                  type="date" 
                  value={filtros.dataInicio} 
                  onChange={e => setFiltros({ ...filtros, dataInicio: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Data fim</Label>
                <Input 
                  type="date" 
                  value={filtros.dataFim} 
                  onChange={e => setFiltros({ ...filtros, dataFim: e.target.value })} 
                />
              </div>

              {/* Tipo de Indicação */}
              <div className="space-y-2">
                <Label>Tipo de indicação</Label>
                <Select 
                  value={filtros.tipoIndicacao} 
                  onValueChange={v => setFiltros({ ...filtros, tipoIndicacao: v as any })}
                >
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

              {/* Indicado por */}
              <div className="space-y-2">
                <Label>Indicado por</Label>
                <Select 
                  value={filtros.indicadoPorId} 
                  onValueChange={v => setFiltros({ ...filtros, indicadoPorId: v })}
                >
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

              {/* Mínimos */}
              <div className="space-y-2">
                <Label>Projetos mínimos</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={filtros.projetosMin} 
                  onChange={e => setFiltros({ ...filtros, projetosMin: Number(e.target.value || 0) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Transações mínimas</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={filtros.transacoesMin} 
                  onChange={e => setFiltros({ ...filtros, transacoesMin: Number(e.target.value || 0) })} 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" className="rounded-xl" onClick={resetFilters}>
                Limpar
              </Button>
              {filterCityQuery && (
                <Button variant="ghost" className="rounded-xl" onClick={() => setFilterCityQuery("")}>
                  Limpar texto
                </Button>
              )}
              <Button className="rounded-xl">Aplicar</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Column Visibility */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-lg h-9" title="Mostrar/ocultar colunas">
              <EyeOff className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="rounded-xl w-56">
            <div className="space-y-1">
              {Object.keys(colLabels).map((key) => (
                <div key={key} className="flex items-center gap-2 py-1">
                  <Checkbox 
                    id={`col-${key}`} 
                    checked={visibleCols[key]} 
                    onCheckedChange={() => toggleCol(key)} 
                  />
                  <label htmlFor={`col-${key}`} className="text-sm">{colLabels[key]}</label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Additional actions slot */}
        {children}
      </div>

      {/* Sort and Count */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
          <Button 
            variant={sortBy === "ltv" ? "default" : "ghost"} 
            size="sm" 
            className="rounded-md h-7 px-2 text-xs" 
            onClick={() => setSortBy("ltv")}
          >
            LTV
          </Button>
          <Button 
            variant={sortBy === "nome" ? "default" : "ghost"} 
            size="sm" 
            className="rounded-md h-7 px-2 text-xs" 
            onClick={() => setSortBy("nome")}
          >
            Nome
          </Button>
          <Button 
            variant={sortBy === "created_at" ? "default" : "ghost"} 
            size="sm" 
            className="rounded-md h-7 px-2 text-xs" 
            onClick={() => setSortBy("created_at")}
          >
            Data
          </Button>
        </div>

        <Badge variant="outline" className="rounded-md text-xs px-2 py-1 bg-background/50">
          {filteredCount}
        </Badge>
      </div>
    </div>
  );
}

