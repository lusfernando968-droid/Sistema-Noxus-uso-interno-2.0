import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { CidadeOption } from "@/hooks/useClientes";

interface CitySelectorProps {
  selectedCities: CidadeOption[];
  setSelectedCities: (cities: CidadeOption[]) => void;
  availableCities: CidadeOption[];
  cityUsageCounts: Record<string, number>;
  label?: string;
  placeholder?: string;
  showIcon?: boolean;
}

export function CitySelector({
  selectedCities,
  setSelectedCities,
  availableCities,
  cityUsageCounts,
  label = "Cidades",
  placeholder = "Digite e pressione Enter para adicionar",
  showIcon = true
}: CitySelectorProps) {
  const [cityQuery, setCityQuery] = useState("");
  const [cityRankingMode, setCityRankingMode] = useState<"mais_usadas" | "mais_recentes">("mais_usadas");

  // Helper: retorna cidades ordenadas conforme ranking atual e filtradas
  const getRankedCities = useMemo(() => {
    const excludeLower = selectedCities.map(c => (c.nome || "").toLowerCase());
    const filtered = availableCities.filter(c => {
      const notExcluded = !excludeLower.includes((c.nome || "").toLowerCase());
      const matchesQuery = cityQuery ? (c.nome.toLowerCase().includes(cityQuery.toLowerCase())) : true;
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
  }, [availableCities, selectedCities, cityQuery, cityRankingMode, cityUsageCounts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nome = cityQuery.trim();
      if (!nome) return;
      const existing = availableCities.find(c => c.nome.toLowerCase() === nome.toLowerCase());
      if (!selectedCities.some(p => p.nome.toLowerCase() === nome.toLowerCase())) {
        setSelectedCities([...selectedCities, existing ? { id: existing.id, nome: existing.nome } : { nome }]);
      }
      setCityQuery("");
    }
  };

  const removeCity = (nome: string) => {
    setSelectedCities(selectedCities.filter(c => c.nome !== nome));
  };

  const addCity = (city: CidadeOption) => {
    if (!selectedCities.some(p => p.nome.toLowerCase() === city.nome.toLowerCase())) {
      setSelectedCities([...selectedCities, { id: city.id, nome: city.nome }]);
    }
    setCityQuery("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-2">
          {showIcon && <MapPin className="h-4 w-4 text-muted-foreground" />}
          {label}
        </Label>
      )}
      
      {/* Cidades selecionadas */}
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCities.map((c) => (
            <Badge key={c.nome} variant="secondary" className="rounded-full px-2 py-1 text-xs">
              <span>{c.nome}</span>
              <button
                type="button"
                onClick={() => removeCity(c.nome)}
                className="ml-2 text-muted-foreground hover:text-foreground"
                aria-label={`Remover ${c.nome}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Input */}
      <Input
        placeholder={placeholder}
        className="rounded-xl"
        value={cityQuery}
        onChange={e => setCityQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      {/* Ranking toggle */}
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
      
      {/* Sugestões */}
      <div className="mt-2 flex flex-wrap gap-2">
        {getRankedCities.map(c => (
          <Button 
            key={c.id || c.nome} 
            type="button" 
            variant="outline" 
            size="sm" 
            className="rounded-full h-7"
            onClick={() => addCity(c)}
          >
            {c.nome}
          </Button>
        ))}
      </div>
    </div>
  );
}

