import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCampanhas } from "@/hooks/useCampanhas";

export default function CampanhaStats() {
  const { stats } = useCampanhas();
  const { porStatus, totalOrcamento } = stats;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <Card className="rounded-2xl border">
        <CardHeader><CardTitle className="text-sm">Rascunhos</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-semibold">{porStatus.RASCUNHO}</p></CardContent>
      </Card>
      <Card className="rounded-2xl border">
        <CardHeader><CardTitle className="text-sm">Ativas</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-semibold">{porStatus.ATIVA}</p></CardContent>
      </Card>
      <Card className="rounded-2xl border">
        <CardHeader><CardTitle className="text-sm">Pausadas</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-semibold">{porStatus.PAUSADA}</p></CardContent>
      </Card>
      <Card className="rounded-2xl border">
        <CardHeader><CardTitle className="text-sm">Orçamento total</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-semibold">R$ {totalOrcamento.toFixed(2)}</p></CardContent>
      </Card>
    </div>
  );
}

