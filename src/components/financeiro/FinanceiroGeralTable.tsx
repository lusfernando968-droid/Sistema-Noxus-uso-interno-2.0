import { useFinanceiroGeral, CATEGORIAS_GERAIS, FORMAS_PAGAMENTO, FinanceiroGeralRecord, financeiroGeralSchema } from "@/hooks/useFinanceiroGeral";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { calcularSaldoConta, saldoPosTransacao } from "@/utils/saldoPorConta";

type FormValues = {
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  forma_pagamento: string;
  tipo: 'entrada' | 'saida';
  comprovante?: string;
  observacoes?: string;
  conta_id?: string;
};

export default function FinanceiroGeralTable() {
  const { items, stats, insert, update, remove } = useFinanceiroGeral();
  const { toast } = useToast();
  const { items: contas } = useContasBancarias();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceiroGeralRecord | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(financeiroGeralSchema as any),
    defaultValues: {
      data: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
      descricao: "",
      valor: 0,
      categoria: CATEGORIAS_GERAIS[0],
      forma_pagamento: FORMAS_PAGAMENTO[0],
      tipo: 'saida',
      comprovante: "",
      observacoes: "",
      conta_id: undefined,
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      data: new Date().toISOString().slice(0, 16),
      descricao: "",
      valor: 0,
      categoria: CATEGORIAS_GERAIS[0],
      forma_pagamento: FORMAS_PAGAMENTO[0],
      tipo: 'saida',
      comprovante: "",
      observacoes: "",
      conta_id: undefined,
    });
    setIsOpen(true);
  };

  const openEdit = (row: FinanceiroGeralRecord) => {
    if (row.readOnly) return;
    setEditing(row);
    form.reset({
      data: new Date(row.data).toISOString().slice(0, 16),
      descricao: row.descricao || "",
      valor: Number(row.valor) || 0,
      categoria: row.categoria || CATEGORIAS_GERAIS[0],
      forma_pagamento: row.forma_pagamento || FORMAS_PAGAMENTO[0],
      tipo: row.tipo || 'saida',
      comprovante: row.comprovante || "",
      observacoes: row.observacoes || "",
      conta_id: row.conta_id || undefined,
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: FinanceiroGeralRecord = {
        ...data,
        // Conversão para ISO
        data: new Date(data.data).toISOString(),
        valor: Number(data.valor),
        comprovante: data.comprovante || undefined,
        conta_id: data.conta_id || null,
      };
    
      if (editing?.id) {
        await update(editing.id, payload);
        toast({ title: "Atualizado", description: "Registro alterado com sucesso." });
      } else {
        await insert(payload);
        toast({ title: "Criado", description: "Registro adicionado com sucesso." });
      }
      setIsOpen(false);
    } catch (_) {}
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Entradas e Saídas</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="default" onClick={openCreate} aria-label="Adicionar transação">
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar transação" : "Nova transação"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Input id="data" type="datetime-local" {...form.register("data")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor</Label>
                      <Input id="valor" type="number" step="0.01" {...form.register("valor", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as 'entrada' | 'saida')}>
                        <SelectTrigger aria-label="Selecionar tipo de transação">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Select value={form.watch("conta_id")} onValueChange={(v) => form.setValue("conta_id", v)}>
                      <SelectTrigger aria-label="Selecionar conta">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma conta</SelectItem>
                        {contas.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.watch("conta_id") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        const contaId = form.watch("conta_id") || "";
                        const saldoConta = calcularSaldoConta(contaId, contas as any, items as any);
                        const tipoPreview = form.watch("tipo") === 'entrada' ? 'receita' : 'despesa';
                        const valorPreview = Number(form.watch("valor") || 0);
                        const saldoPos = saldoPosTransacao(saldoConta.saldoAtual, tipoPreview, valorPreview, true);
                        return (
                          <>
                            <div className="space-y-1">
                              <Label>Saldo inicial</Label>
                              <p className="text-sm font-semibold">R$ {saldoConta.saldoInicial.toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                              <Label>Saldo atual</Label>
                              <p className={`text-sm font-semibold ${saldoConta.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {saldoConta.saldoAtual.toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                              <Label>Saldo pós-transação</Label>
                              <p className={`text-sm font-semibold ${saldoPos >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {saldoPos.toFixed(2)}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input id="descricao" {...form.register("descricao")} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={form.watch("categoria")} onValueChange={(v) => form.setValue("categoria", v)}>
                        <SelectTrigger aria-label="Selecionar categoria">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS_GERAIS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Forma de pagamento</Label>
                      <Select value={form.watch("forma_pagamento")} onValueChange={(v) => form.setValue("forma_pagamento", v)}>
                        <SelectTrigger aria-label="Selecionar forma de pagamento">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAS_PAGAMENTO.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comprovante">Comprovante (URL)</Label>
                    <Input id="comprovante" placeholder="https://..." {...form.register("comprovante")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea id="observacoes" rows={3} {...form.register("observacoes")} />
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
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.data).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[320px] truncate" title={row.descricao}>{row.descricao}</TableCell>
                    <TableCell className="text-right">
                      <span className={row.tipo === 'entrada' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        R$ {Number(row.valor).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {row.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </TableCell>
                    <TableCell>{row.categoria}</TableCell>
                    <TableCell>{row.forma_pagamento}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {row.readOnly ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { if (row.editLink) window.location.href = row.editLink; }}
                            aria-label={`Editar no Tattoo ${row.descricao}`}
                          >
                            Editar no Tattoo
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => openEdit(row)} aria-label={`Editar ${row.descricao}`}>Editar</Button>
                            <Button variant="destructive" size="sm" onClick={() => remove(row.id!)} aria-label={`Excluir ${row.descricao}`}>Excluir</Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Total de Entradas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-green-600">R$ {stats.totalEntradas.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Total de Saídas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-red-600">R$ {stats.totalSaidas.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-semibold ${
                  stats.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {stats.saldo.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.entries(stats.porCategoriaEntradas).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Entradas:</p>
                      {Object.entries(stats.porCategoriaEntradas).map(([cat, val]) => (
                        <div key={`entrada-${cat}`} className="px-2 py-1 rounded bg-green-50 text-xs">
                          {cat}: R$ {val.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.entries(stats.porCategoriaSaidas).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Saídas:</p>
                      {Object.entries(stats.porCategoriaSaidas).map(([cat, val]) => (
                        <div key={`saida-${cat}`} className="px-2 py-1 rounded bg-red-50 text-xs">
                          {cat}: R$ {val.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
