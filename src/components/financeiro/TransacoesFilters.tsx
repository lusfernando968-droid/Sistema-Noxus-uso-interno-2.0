import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TipoTransacao, CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from "@/services/transacoes.service";

interface ContaBancaria {
  id: string;
  nome: string;
  banco_detalhes?: { nome_curto?: string } | null;
  banco?: string;
}

interface TransacoesFiltersProps {
  filtroTipo: "TODOS" | TipoTransacao;
  setFiltroTipo: (value: "TODOS" | TipoTransacao) => void;
  filtroCategoria: string;
  setFiltroCategoria: (value: string) => void;
  filtroStatus: "TODOS" | "LIQUIDADAS" | "PENDENTES";
  setFiltroStatus: (value: "TODOS" | "LIQUIDADAS" | "PENDENTES") => void;
  filtroContaId: string;
  setFiltroContaId: (value: string) => void;
  contas: ContaBancaria[];
  resultCount: number;
}

export function TransacoesFilters({
  filtroTipo,
  setFiltroTipo,
  filtroCategoria,
  setFiltroCategoria,
  filtroStatus,
  setFiltroStatus,
  filtroContaId,
  setFiltroContaId,
  contas,
  resultCount,
}: TransacoesFiltersProps) {
  const hasActiveFilters =
    filtroTipo !== "TODOS" ||
    filtroCategoria !== "TODOS" ||
    filtroStatus !== "TODOS" ||
    filtroContaId !== "TODAS";

  const categoriasComPrefixo = [
    ...CATEGORIAS_RECEITA.map(cat => ({ key: `receita-${cat}`, value: cat, label: cat })),
    ...CATEGORIAS_DESPESA.map(cat => ({ key: `despesa-${cat}`, value: cat, label: cat }))
  ];

  const categoriasParaFiltro = categoriasComPrefixo.filter((cat, index, self) =>
    self.findIndex(c => c.value === cat.value) === index
  );

  const handleLimpar = () => {
    setFiltroTipo("TODOS");
    setFiltroCategoria("TODOS");
    setFiltroStatus("TODOS");
    setFiltroContaId("TODAS");
  };

  const getContaLabel = (contaId: string): string => {
    const c = contas.find(c => String(c.id) === contaId);
    if (!c) return "Conta";
    const bank = c.banco_detalhes?.nome_curto || c.banco || "";
    return bank ? `${bank} · ${c.nome}` : c.nome;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-lg h-9">
          Filtros
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[520px] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {resultCount} resultados
            </Badge>
            <Button
              variant="ghost"
              className="rounded-xl"
              disabled={!hasActiveFilters}
              onClick={handleLimpar}
            >
              Limpar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as "TODOS" | TipoTransacao)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="RECEITA">Receitas</SelectItem>
                <SelectItem value="DESPESA">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas</SelectItem>
                {categoriasParaFiltro.map((cat) => (
                  <SelectItem key={cat.key} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as "TODOS" | "LIQUIDADAS" | "PENDENTES")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="LIQUIDADAS">Liquidadas</SelectItem>
                <SelectItem value="PENDENTES">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={filtroContaId} onValueChange={setFiltroContaId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                {contas.map((c) => {
                  const bank = c.banco_detalhes?.nome_curto || c.banco || "";
                  const label = bank ? `${bank} · ${c.nome}` : c.nome;
                  return (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Filtros ativos:</span>
            {filtroTipo !== "TODOS" && (
              <Badge variant="secondary" className="rounded-full text-xs">{filtroTipo}</Badge>
            )}
            {filtroCategoria !== "TODOS" && (
              <Badge variant="secondary" className="rounded-full text-xs">{filtroCategoria}</Badge>
            )}
            {filtroStatus !== "TODOS" && (
              <Badge variant="secondary" className="rounded-full text-xs">{filtroStatus}</Badge>
            )}
            {filtroContaId !== "TODAS" && (
              <Badge variant="secondary" className="rounded-full text-xs">
                {getContaLabel(filtroContaId)}
              </Badge>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default TransacoesFilters;

