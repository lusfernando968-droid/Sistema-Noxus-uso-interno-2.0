import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search } from "lucide-react";

interface AgendamentosFiltersProps {
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroStatus: string;
  onFiltroStatusChange: (value: string) => void;
}

export function AgendamentosFilters({
  busca,
  onBuscaChange,
  filtroStatus,
  onFiltroStatusChange,
}: AgendamentosFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, serviço ou projeto..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-10 rounded-lg border-muted/50 bg-background/50 backdrop-blur-sm h-9"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="rounded-lg h-9">Filtros</Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] rounded-xl p-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={onFiltroStatusChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="rounded-xl" onClick={() => onFiltroStatusChange('todos')}>
                Limpar
              </Button>
              <Button className="rounded-xl">Aplicar</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

