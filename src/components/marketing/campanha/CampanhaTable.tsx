import { useEffect, useMemo, useState } from "react";
import { useCampanhas, CampanhaRecord, CampanhaCanal, CampanhaStatus } from "@/hooks/useCampanhas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CampanhaFormModal from "./CampanhaFormModal";

const canais: (CampanhaCanal | 'TODOS')[] = ['TODOS','INSTAGRAM','FACEBOOK','TIKTOK','GOOGLE_ADS','ORGANICO','EMAIL'];
const statuses: (CampanhaStatus | 'TODOS')[] = ['TODOS','RASCUNHO','ATIVA','PAUSADA','ENCERRADA'];

export default function CampanhaTable() {
  const { items, filters, setFilters, create, update, remove, duplicate, setStatus } = useCampanhas();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CampanhaRecord | null>(null);
  const [metrics, setMetrics] = useState<Record<string, { leads: number; alcance: number }>>({});

  useEffect(() => {
    setMetrics((prev) => {
      const next = { ...prev };
      items.forEach((row, idx) => {
        const key = String(row.id || `temp-${idx}-${row.titulo}`);
        if (!next[key]) next[key] = { leads: 0, alcance: 0 };
      });
      return next;
    });
  }, [items]);

  const cplByKey = useMemo(() => {
    const out: Record<string, number> = {};
    items.forEach((row, idx) => {
      const key = String(row.id || `temp-${idx}-${row.titulo}`);
      const leads = metrics[key]?.leads || 0;
      const budget = Number(row.orcamento || 0);
      out[key] = leads > 0 ? budget / leads : 0;
    });
    return out;
  }, [items, metrics]);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (row: CampanhaRecord) => { setEditing(row); setOpen(true); };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Campanhas</CardTitle>
            <Button onClick={openCreate}>Nova campanha</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={(filters.status || 'TODOS') as string} onValueChange={(v) => setFilters({ ...filters, status: v as any })}>
                <SelectTrigger aria-label="Filtrar status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={(filters.canal || 'TODOS') as string} onValueChange={(v) => setFilters({ ...filters, canal: v as any })}>
                <SelectTrigger aria-label="Filtrar canal"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {canais.map(c => <SelectItem key={c} value={c}>{String(c).replace("_"," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inicio">Início</Label>
              <Input id="inicio" type="date" value={filters.periodo?.inicio || ""} onChange={(e) => setFilters({ ...filters, periodo: { ...filters.periodo, inicio: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Fim</Label>
              <Input id="fim" type="date" value={filters.periodo?.fim || ""} onChange={(e) => setFilters({ ...filters, periodo: { ...filters.periodo, fim: e.target.value } })} />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <Label htmlFor="busca">Busca</Label>
            <Input id="busca" placeholder="Buscar por título" value={filters.q || ""} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </div>
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Orçamento</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Alcance</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row, idx) => {
                  const key = String(row.id || `temp-${idx}-${row.titulo}`);
                  return (
                  <TableRow key={key}>
                    <TableCell className="max-w-[280px] truncate" title={row.titulo}>{row.titulo}</TableCell>
                    <TableCell>{String(row.canal).replace("_"," ")}</TableCell>
                    <TableCell>{[row.data_inicio, row.data_fim].filter(Boolean).join(" → ")}</TableCell>
                    <TableCell className="text-right">R$ {(Number(row.orcamento || 0)).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="w-24 text-right"
                        type="number"
                        min={0}
                        value={metrics[key]?.leads ?? 0}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value || 0));
                          setMetrics((m) => ({ ...m, [key]: { leads: v, alcance: m[key]?.alcance ?? 0 } }));
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="w-28 text-right"
                        type="number"
                        min={0}
                        value={metrics[key]?.alcance ?? 0}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value || 0));
                          setMetrics((m) => ({ ...m, [key]: { leads: m[key]?.leads ?? 0, alcance: v } }));
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {metrics[key]?.leads ? (
                        <span className="font-semibold">R$ {cplByKey[key].toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(row)}>Editar</Button>
                        <Button variant="outline" size="sm" onClick={() => duplicate(row.id!)}>Duplicar</Button>
                        {row.status !== 'ATIVA' && (<Button variant="default" size="sm" onClick={() => setStatus(row.id!, 'ATIVA')}>Ativar</Button>)}
                        {row.status === 'ATIVA' && (<Button variant="secondary" size="sm" onClick={() => setStatus(row.id!, 'PAUSADA')}>Pausar</Button>)}
                        <Button variant="destructive" size="sm" onClick={() => remove(row.id!)}>Excluir</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CampanhaFormModal
        open={open}
        onOpenChange={setOpen}
        editing={editing || undefined}
        onSubmit={async (payload) => {
          if (editing?.id) {
            await update(editing.id, payload);
          } else {
            await create(payload);
          }
        }}
      />
    </div>
  );
}
