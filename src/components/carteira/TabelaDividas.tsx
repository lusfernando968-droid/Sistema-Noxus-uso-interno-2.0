import { useDividas, DividaRecord, dividaSchema } from "@/hooks/useDividas";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type FormValues = {
  credor: string;
  valor: number;
  data_vencimento: string;
  status: 'ABERTA' | 'PAGA';
  conta_id?: string;
  observacoes?: string;
  data_pagamento?: string | null;
  total_parcelas?: number;
  parcela_atual?: number;
  periodicidade?: 'MENSAL' | 'SEMANAL' | 'QUINZENAL';
};

export default function TabelaDividas() {
  const { items, insert, update, remove } = useDividas();
  const { items: contas } = useContasBancarias();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<DividaRecord | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(dividaSchema as any),
    defaultValues: {
      credor: "",
      valor: 0,
      data_vencimento: new Date().toISOString().slice(0, 10),
      status: 'ABERTA',
      conta_id: "",
      observacoes: "",
      data_pagamento: null,
      total_parcelas: 1,
      parcela_atual: 1,
      periodicidade: 'MENSAL',
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      credor: "",
      valor: 0,
      data_vencimento: new Date().toISOString().slice(0, 10),
      status: 'ABERTA',
      conta_id: "",
      observacoes: "",
      data_pagamento: null,
      total_parcelas: 1,
      parcela_atual: 1,
      periodicidade: 'MENSAL',
    });
    setIsOpen(true);
  };

  const openEdit = (row: DividaRecord) => {
    setEditing(row);
    form.reset({
      credor: row.credor,
      valor: Number(row.valor) || 0,
      data_vencimento: row.data_vencimento,
      status: row.status,
      conta_id: row.conta_id || "",
      observacoes: row.observacoes || "",
      data_pagamento: row.data_pagamento || null,
      total_parcelas: (row.total_parcelas as any) ?? 1,
      parcela_atual: (row.parcela_atual as any) ?? 1,
      periodicidade: (row.periodicidade as any) ?? 'MENSAL',
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload: DividaRecord = {
      credor: data.credor,
      valor: Number(data.valor),
      data_vencimento: data.data_vencimento,
      status: data.status,
      conta_id: data.conta_id || null,
      observacoes: data.observacoes || null,
      data_pagamento: data.status === 'PAGA' ? (data.data_pagamento || new Date().toISOString().slice(0, 10)) : null,
      total_parcelas: Number(data.total_parcelas || 1),
      parcela_atual: Number(data.parcela_atual || 1),
      periodicidade: (data.periodicidade || 'MENSAL') as any,
    };
    if (editing?.id) {
      await update(editing.id, payload);
    } else {
      await insert(payload);
    }
    setIsOpen(false);
  };

  return (
    <Card className="rounded-3xl border border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Dívidas</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={openCreate} aria-label="Adicionar dívida">Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar dívida" : "Nova dívida"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credor">Credor</Label>
                    <Input id="credor" {...form.register("credor")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input id="valor" type="number" step="0.01" {...form.register("valor", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_vencimento">Vencimento</Label>
                    <Input id="data_vencimento" type="date" {...form.register("data_vencimento")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as 'ABERTA' | 'PAGA')}>
                      <SelectTrigger aria-label="Selecionar status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABERTA">Aberta</SelectItem>
                        <SelectItem value="PAGA">Paga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Select value={(form.watch("conta_id") || "none") as string} onValueChange={(v) => form.setValue("conta_id", v === "none" ? "" : v)}>
                      <SelectTrigger aria-label="Selecionar conta">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma conta</SelectItem>
                        {(Array.isArray(contas) ? contas : [])
                          .filter((c) => !!c && !!c.id && String(c.id).trim().length > 0)
                          .map((c) => (
                            <SelectItem key={String(c.id)} value={String(c.id)}>{c.nome}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.watch("status") === 'PAGA' && (
                    <div className="space-y-2">
                      <Label htmlFor="data_pagamento">Pagamento</Label>
                      <Input id="data_pagamento" type="date" {...form.register("data_pagamento")} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input id="observacoes" {...form.register("observacoes")} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_parcelas">Total de parcelas</Label>
                    <Input id="total_parcelas" type="number" min={1} step={1} {...form.register("total_parcelas", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parcela_atual">Parcela atual</Label>
                    <Input id="parcela_atual" type="number" min={1} step={1} {...form.register("parcela_atual", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Periodicidade</Label>
                    <Select value={form.watch("periodicidade") as any} onValueChange={(v) => form.setValue("periodicidade", v as any)}>
                      <SelectTrigger aria-label="Selecionar periodicidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MENSAL">Mensal</SelectItem>
                        <SelectItem value="SEMANAL">Semanal</SelectItem>
                        <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Próximos vencimentos</Label>
                  {(() => {
                    const baseStr = form.watch("data_vencimento");
                    const base = baseStr ? new Date(baseStr) : new Date();
                    const total = Number(form.watch("total_parcelas") || 1);
                    const atual = Number(form.watch("parcela_atual") || 1);
                    const periodicidade = form.watch("periodicidade") || 'MENSAL';
                    const prox: string[] = [];
                    const addDays = (d: Date, days: number) => { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; };
                    const addMonths = (d: Date, months: number) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + months); return nd; };
                    const stepDays = periodicidade === 'SEMANAL' ? 7 : (periodicidade === 'QUINZENAL' ? 14 : 30);
                    for (let i = atual + 1; i <= Math.min(total, atual + 3); i++) {
                      const idx = i - 1;
                      const d = periodicidade === 'MENSAL' ? addMonths(base, idx) : addDays(base, idx * stepDays);
                      prox.push(d.toISOString().slice(0, 10));
                    }
                    return <p className="text-sm">{prox.length ? prox.join(" • ") : "—"}</p>;
                  })()}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Credor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Próx. venc.</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.data_vencimento}</TableCell>
                  <TableCell className="max-w-[320px] truncate" title={row.credor}>{row.credor}</TableCell>
                  <TableCell className="text-right">
                    <span className={row.status === 'ABERTA' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      R$ {Number(row.valor).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>{row.status === 'ABERTA' ? 'Aberta' : 'Paga'}</TableCell>
                  <TableCell>{(() => {
                    const conta = (Array.isArray(contas) ? contas : []).find((c) => String(c.id) === String(row.conta_id || ''));
                    return conta ? conta.nome : '-';
                  })()}</TableCell>
                  <TableCell>{`${Number(row.parcela_atual || 1)}/${Number(row.total_parcelas || 1)}`}</TableCell>
                  <TableCell>{(() => {
                    const baseStr = row.data_vencimento;
                    const base = baseStr ? new Date(baseStr) : new Date();
                    const atual = Number(row.parcela_atual || 1);
                    const periodicidade = (row.periodicidade as any) || 'MENSAL';
                    const addDays = (d: Date, days: number) => { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; };
                    const addMonths = (d: Date, months: number) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + months); return nd; };
                    const stepDays = periodicidade === 'SEMANAL' ? 7 : (periodicidade === 'QUINZENAL' ? 14 : 30);
                    const idx = atual; // próxima parcela index
                    const d = periodicidade === 'MENSAL' ? addMonths(base, idx) : addDays(base, idx * stepDays);
                    return d.toISOString().slice(0, 10);
                  })()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)} aria-label={`Editar ${row.credor}`}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(row.id!)} aria-label={`Excluir ${row.credor}`}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
