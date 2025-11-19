import { useLinhasCredito, LinhaCreditoRecord, linhaCreditoSchema } from "@/hooks/useLinhasCredito";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type FormValues = {
  nome: string;
  banco_id?: string;
  limite: number;
  utilizado: number;
  taxa_juros?: number | null;
  modalidade: 'ROTATIVO' | 'PARCELADO' | 'CARTAO' | 'EMPRESTIMO';
  vencimento_dia?: number | null;
  data_abertura?: string | null;
  status: 'ATIVA' | 'INATIVA';
  observacoes?: string | null;
};

export default function TabelaLinhasCredito() {
  const { items, insert, update, remove } = useLinhasCredito();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<LinhaCreditoRecord | null>(null);
  const [bancos, setBancos] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBancos = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("banco_id, banco_detalhes:bancos(*)")
        .eq("user_id", user.id)
        .eq("is_arquivada", false);
      if (error) return setBancos([]);
      const uniq: Record<string, any> = {};
      (data || []).forEach((row: any) => {
        const bid = String(row.banco_id || "");
        if (!bid) return;
        if (!uniq[bid]) {
          const bd = row.banco_detalhes || {};
          uniq[bid] = { id: bid, nome_curto: bd.nome_curto || bd.nome || bid, nome: bd.nome || bd.nome_curto || bid };
        }
      });
      setBancos(Object.values(uniq));
    };
    fetchBancos();
  }, [user]);

  const form = useForm<FormValues>({
    resolver: zodResolver(linhaCreditoSchema as any),
    defaultValues: {
      nome: "",
      banco_id: "",
      limite: 0,
      utilizado: 0,
      taxa_juros: null,
      modalidade: 'ROTATIVO',
      vencimento_dia: null,
      data_abertura: new Date().toISOString().slice(0, 10),
      status: 'ATIVA',
      observacoes: "",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      nome: "",
      banco_id: "",
      limite: 0,
      utilizado: 0,
      taxa_juros: null,
      modalidade: 'ROTATIVO',
      vencimento_dia: null,
      data_abertura: new Date().toISOString().slice(0, 10),
      status: 'ATIVA',
      observacoes: "",
    });
    setIsOpen(true);
  };

  const openEdit = (row: LinhaCreditoRecord) => {
    setEditing(row);
    form.reset({
      nome: row.nome,
      banco_id: row.banco_id || "",
      limite: Number(row.limite) || 0,
      utilizado: Number(row.utilizado) || 0,
      taxa_juros: row.taxa_juros ?? null,
      modalidade: row.modalidade,
      vencimento_dia: row.vencimento_dia ?? null,
      data_abertura: row.data_abertura || new Date().toISOString().slice(0, 10),
      status: row.status,
      observacoes: row.observacoes || "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload: LinhaCreditoRecord = {
      nome: data.nome,
      banco_id: data.banco_id || null,
      limite: Number(data.limite || 0),
      utilizado: Number(data.utilizado || 0),
      taxa_juros: data.taxa_juros ?? null,
      modalidade: data.modalidade,
      vencimento_dia: data.vencimento_dia ?? null,
      data_abertura: data.data_abertura || null,
      status: data.status,
      observacoes: data.observacoes || null,
    };
    if (editing?.id) {
      await update(editing.id, payload);
    } else {
      await insert(payload);
    }
    setIsOpen(false);
  };

  const disponivel = (r: LinhaCreditoRecord) => Number(r.limite || 0) - Number(r.utilizado || 0);

  return (
    <Card className="rounded-3xl border border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Linhas de Crédito</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={openCreate} aria-label="Adicionar linha">Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar linha" : "Nova linha de crédito"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" {...form.register("nome")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limite">Limite</Label>
                    <Input id="limite" type="number" step="0.01" {...form.register("limite", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utilizado">Utilizado</Label>
                    <Input id="utilizado" type="number" step="0.01" {...form.register("utilizado", { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Select value={(form.watch("banco_id") || "none") as string} onValueChange={(v) => form.setValue("banco_id", v === "none" ? "" : v)}>
                      <SelectTrigger aria-label="Selecionar banco">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {(Array.isArray(bancos) ? bancos : [])
                          .filter((b) => !!b && !!b.id)
                          .map((b) => (
                            <SelectItem key={String(b.id)} value={String(b.id)}>{b.nome_curto || b.nome}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modalidade</Label>
                    <Select value={form.watch("modalidade") as any} onValueChange={(v) => form.setValue("modalidade", v as any)}>
                      <SelectTrigger aria-label="Selecionar modalidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROTATIVO">Rotativo</SelectItem>
                        <SelectItem value="PARCELADO">Parcelado</SelectItem>
                        <SelectItem value="CARTAO">Cartão</SelectItem>
                        <SelectItem value="EMPRESTIMO">Empréstimo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxa_juros">Taxa (%)</Label>
                    <Input id="taxa_juros" type="number" step="0.001" {...form.register("taxa_juros", { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vencimento_dia">Vencimento (dia)</Label>
                    <Input id="vencimento_dia" type="number" min={1} max={31} step={1} {...form.register("vencimento_dia", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_abertura">Abertura</Label>
                    <Input id="data_abertura" type="date" {...form.register("data_abertura")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.watch("status") as any} onValueChange={(v) => form.setValue("status", v as any)}>
                      <SelectTrigger aria-label="Selecionar status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVA">Ativa</SelectItem>
                        <SelectItem value="INATIVA">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input id="observacoes" {...form.register("observacoes")} />
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
                <TableHead>Banco</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Limite</TableHead>
                <TableHead className="text-right">Utilizado</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Venc. dia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{(() => {
                    const b = (bancos || []).find((x) => String(x.id) === String(row.banco_id || ''));
                    return b ? (b.nome_curto || b.nome) : '-';
                  })()}</TableCell>
                  <TableCell className="max-w-[320px] truncate" title={row.nome}>{row.nome}</TableCell>
                  <TableCell className="text-right">R$ {Number(row.limite).toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {Number(row.utilizado).toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {disponivel(row).toFixed(2)}</TableCell>
                  <TableCell>{row.modalidade}</TableCell>
                  <TableCell>{row.taxa_juros != null ? `${Number(row.taxa_juros).toFixed(3)}%` : '-'}</TableCell>
                  <TableCell>{row.vencimento_dia ?? '-'}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)} aria-label={`Editar ${row.nome}`}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(row.id!)} aria-label={`Excluir ${row.nome}`}>Excluir</Button>
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
