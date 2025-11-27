import { useCarteira, CarteiraRecord, carteiraSchema } from "@/hooks/useCarteira";
import { useDividas } from "@/hooks/useDividas";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { calcularSaldoConta, saldoPosTransacao } from "@/utils/saldoPorConta";

type FormValues = {
  tipo: 'RECEITA' | 'DESPESA' | 'APORTE';
  categoria: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
  data_liquidacao?: string | null;
  conta_id?: string;
  conta_destino_id?: string;
  divida_id?: string;
};

const CATEGORIAS_RECEITA = [
  "Recebimento de Cliente",
  "Depósito",
  "Transferência (Entrada)",
  "Rendimento",
  "Ajuste de Saldo",
  "Outros",
];
const CATEGORIAS_DESPESA = [
  "Taxas Bancárias",
  "Pagamento de Boleto",
  "Transferência (Saída)",
  "Saque",
  "Ajuste de Saldo",
  "Pagamento de Dívida",
  "Outros",
];

const formSchema = carteiraSchema.extend({
  divida_id: z.string().optional(),
});

export default function CarteiraTable() {
  const { items: carteiraItems, insert, update, remove } = useCarteira();
  const { items: dividas, update: updateDivida } = useDividas();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<CarteiraRecord | null>(null);
  const { items: contas } = useContasBancarias();
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'RECEITA' | 'DESPESA' | 'APORTE'>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroContaId, setFiltroContaId] = useState<string>('TODAS');
  const [filtroInicio, setFiltroInicio] = useState<string>('');
  const [filtroFim, setFiltroFim] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const calcPreviewSafe = () => {
    try {
      const contaId = form.watch("conta_id") || "";
      const tipoPreview = form.watch("tipo") === 'RECEITA' ? 'receita' : 'despesa';
      const valorPreview = Number(form.watch("valor") || 0) || 0;
      const saldoConta = calcularSaldoConta(contaId, Array.isArray(contas) ? contas as any : [], Array.isArray(carteiraItems) ? carteiraItems as any : []);
      const saldoPos = saldoPosTransacao(Number(saldoConta.saldoAtual || 0), tipoPreview, valorPreview, true);
      return { saldoInicial: Number(saldoConta.saldoInicial || 0), saldoAtual: Number(saldoConta.saldoAtual || 0), saldoPos: Number(saldoPos || 0) };
    } catch (err) {
      console.error("Erro ao calcular preview de saldo na Carteira:", err);
      return { saldoInicial: 0, saldoAtual: 0, saldoPos: 0 };
    }
  };

  // Abre modal via evento global disparado pelo DockFinanceiro
  useEffect(() => {
    const openModal = () => openCreate();
    window.addEventListener("openAddTransaction", openModal);
    return () => window.removeEventListener("openAddTransaction", openModal);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'RECEITA',
      categoria: CATEGORIAS_RECEITA[0],
      valor: 0,
      data_vencimento: new Date().toISOString().slice(0, 10),
      descricao: "",
      data_liquidacao: new Date().toISOString().slice(0, 10),
      conta_id: "",
      conta_destino_id: "",
      divida_id: "",
    },
  });

  useEffect(() => {
    form.register("conta_id");
    form.register("conta_destino_id");
    return () => { };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (form.watch("tipo") === 'APORTE') {
      const origem = form.watch("conta_id") || '';
      const destino = form.watch("conta_destino_id") || '';
      if (origem && (!destino || destino === origem)) {
        const outra = (Array.isArray(contas) ? contas : []).find((c) => String(c.id) !== String(origem));
        if (outra) form.setValue("conta_destino_id", String((outra as any).id));
      }
    }
  }, [form.watch("tipo"), form.watch("conta_id"), form.watch("conta_destino_id"), contas]);

  const tipoSelecionado = form.watch("tipo");
  useEffect(() => {
    if (tipoSelecionado === 'APORTE') {
      form.setValue('categoria', 'Aporte');
    }
  }, [tipoSelecionado]);

  // Monitorar seleção de dívida para preencher campos
  const dividaSelecionada = form.watch("divida_id");
  useEffect(() => {
    if (dividaSelecionada && dividaSelecionada !== "none") {
      const divida = dividas.find(d => d.id === dividaSelecionada);
      if (divida) {
        form.setValue("descricao", `Pagamento: ${divida.credor}`);
        form.setValue("valor", Number(divida.valor));
        // Opcional: definir data de vencimento da transação como hoje ou vencimento da dívida
        // form.setValue("data_vencimento", new Date().toISOString().slice(0, 10));
      }
    }
  }, [dividaSelecionada, dividas, form]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      tipo: 'RECEITA',
      categoria: CATEGORIAS_RECEITA[0],
      valor: 0,
      data_vencimento: new Date().toISOString().slice(0, 10),
      descricao: "",
      data_liquidacao: new Date().toISOString().slice(0, 10),
      conta_id: "",
      conta_destino_id: "",
      divida_id: "",
    });
    setIsOpen(true);
  };

  const openEdit = (row: CarteiraRecord) => {
    setEditing(row);
    form.reset({
      tipo: row.tipo,
      categoria: row.categoria,
      valor: Number(row.valor) || 0,
      data_vencimento: row.data_vencimento,
      descricao: row.descricao || "",
      data_liquidacao: row.data_liquidacao || null,
      conta_id: row.conta_id || "",
      divida_id: "", // Não editamos o vínculo com dívida em transações existentes por enquanto
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.tipo === 'APORTE') {
        const { conta_id: contaIdForm, conta_destino_id: contaDestinoForm } = form.getValues();
        const origem = String(contaIdForm || '').trim();
        const destino = String(contaDestinoForm || '').trim();
        if (!origem || !destino || origem === 'none' || destino === 'none') {
          toast({ title: "Selecione origem e destino", description: "Informe a conta de origem e a conta destino.", variant: "destructive" });
          return;
        }
        if (origem === destino) {
          toast({ title: "Contas iguais", description: "Origem e destino devem ser diferentes.", variant: "destructive" });
          return;
        }
        const valorNum = Number(data.valor) || 0;
        const despesaOrigem: CarteiraRecord = {
          tipo: 'DESPESA',
          categoria: 'Aporte',
          valor: valorNum,
          data_vencimento: data.data_vencimento,
          descricao: data.descricao || 'Aporte para outra conta',
          data_liquidacao: data.data_liquidacao ?? null,
          conta_id: origem,
        };
        const receitaDestino: CarteiraRecord = {
          tipo: 'RECEITA',
          categoria: 'Aporte',
          valor: valorNum,
          data_vencimento: data.data_vencimento,
          descricao: data.descricao || 'Aporte recebido de outra conta',
          data_liquidacao: data.data_liquidacao ?? null,
          conta_id: destino,
        };
        await insert(despesaOrigem);
        await insert(receitaDestino);
        toast({ title: "Aporte criado", description: "Transferência registrada nas duas contas." });
      } else {
        const payload: CarteiraRecord = {
          tipo: data.tipo,
          categoria: data.categoria,
          valor: Number(data.valor),
          data_vencimento: data.data_vencimento,
          descricao: data.descricao,
          data_liquidacao: data.data_liquidacao ?? null,
          conta_id: data.conta_id || undefined,
        };
        if (editing?.id) {
          await update(editing.id, payload);
          toast({ title: "Atualizado", description: "Registro alterado com sucesso." });
        } else {
          await insert(payload);

          // Se houver dívida vinculada, marcar como paga
          if (data.divida_id && data.divida_id !== "none") {
            await updateDivida(data.divida_id, {
              status: 'PAGA',
              data_pagamento: data.data_vencimento // Usando a data da transação como data de pagamento
            });
            toast({ title: "Dívida quitada", description: "A dívida foi marcada como paga." });
          }

          toast({ title: "Criado", description: "Registro adicionado com sucesso." });
        }
      }
      setIsOpen(false);
    } catch (_) { }
  };

  const inRange = (dateStr?: string | null) => {
    const d = (dateStr || '').slice(0, 10);
    if (filtroInicio && d < filtroInicio) return false;
    if (filtroFim && d > filtroFim) return false;
    return true;
  };

  const filteredItems = carteiraItems.filter((row) => {
    if (filtroTipo !== 'TODOS' && row.tipo !== filtroTipo) return false;
    if (filtroCategoria !== 'TODAS' && row.categoria !== filtroCategoria) return false;
    if (filtroContaId !== 'TODAS' && String(row.conta_id || '') !== filtroContaId) return false;
    if (!inRange(row.data_vencimento)) return false;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.data_vencimento).getTime();
    const dateB = new Date(b.data_vencimento).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const filteredContasSaldo = (Array.isArray(contas) ? contas : [])
    .filter((c) => Number(c?.saldo_inicial || 0) > 0)
    .filter((c) => (filtroContaId === 'TODAS' || String(c.id) === filtroContaId))
    .filter(() => (filtroTipo === 'TODOS' || filtroTipo === 'RECEITA'))
    .filter(() => (filtroCategoria === 'TODAS' || filtroCategoria === 'Saldo inicial'))
    .filter((c) => inRange(c.created_at));

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fluxo de caixa geral</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="default" onClick={openCreate} aria-label="Adicionar transação">Adicionar</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar transação" : "Nova transação"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as 'RECEITA' | 'DESPESA' | 'APORTE')}>
                        <SelectTrigger aria-label="Selecionar tipo">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECEITA">Receita</SelectItem>
                          <SelectItem value="DESPESA">Despesa</SelectItem>
                          <SelectItem value="APORTE">Aporte</SelectItem>
                        </SelectContent>
                      </Select>
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
                  <div className="space-y-2">
                    <Label>Banco origem</Label>
                    <Controller
                      name="conta_id"
                      control={form.control}
                      defaultValue={form.getValues("conta_id") || ""}
                      render={({ field }) => (
                        <Select value={(field.value || "none") as string} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                          <SelectTrigger aria-label="Selecionar conta">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma conta</SelectItem>
                            {(Array.isArray(contas) ? contas : [])
                              .filter((c) => !!c && !!c.id && String(c.id).trim().length > 0)
                              .map((c) => {
                                const bank = (c as any).banco_detalhes?.nome_curto || (c as any).banco || "";
                                const label = bank ? `${bank} · ${c.nome}` : `${c.nome}`;
                                return (
                                  <SelectItem key={String(c.id)} value={String(c.id)}>
                                    {label}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {form.watch("conta_id") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        const { saldoInicial, saldoAtual, saldoPos } = calcPreviewSafe();
                        return (
                          <>
                            <div className="space-y-1">
                              <Label>Saldo inicial</Label>
                              <p className="text-sm font-semibold">R$ {saldoInicial.toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                              <Label>Saldo atual</Label>
                              <p className={`text-sm font-semibold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {saldoAtual.toFixed(2)}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.watch("tipo") !== 'APORTE' ? (
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={form.watch("categoria")} onValueChange={(v) => form.setValue("categoria", v)}>
                          <SelectTrigger aria-label="Selecionar categoria">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(form.watch("tipo") === 'RECEITA' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input id="descricao" {...form.register("descricao")} />
                    </div>
                  </div>
                  {form.watch("categoria") === 'Pagamento de Dívida' && (
                    <div className="space-y-2">
                      <Label>Dívida a pagar</Label>
                      <Controller
                        name="divida_id"
                        control={form.control}
                        defaultValue=""
                        render={({ field }) => (
                          <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a dívida" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Selecione...</SelectItem>
                              {dividas
                                .filter(d => d.status === 'ABERTA')
                                .map(d => (
                                  <SelectItem key={d.id} value={d.id || ""}>
                                    {d.credor} - R$ {Number(d.valor).toFixed(2)} - Venc: {new Date(d.data_vencimento).toLocaleDateString('pt-BR')}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                  {form.watch("tipo") === 'APORTE' && (
                    <div className="space-y-2">
                      <Label>Banco destino</Label>
                      <Controller
                        name="conta_destino_id"
                        control={form.control}
                        defaultValue={form.getValues("conta_destino_id") || ""}
                        render={({ field }) => (
                          <Select value={(field.value || "none") as string} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                            <SelectTrigger aria-label="Selecionar conta destino">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma conta</SelectItem>
                              {(Array.isArray(contas) ? contas : [])
                                .filter((c) => !!c && !!c.id && String(c.id).trim().length > 0)
                                .map((c) => {
                                  const bank = (c as any).banco_detalhes?.nome_curto || (c as any).banco || "";
                                  const label = bank ? `${bank} · ${c.nome}` : `${c.nome}`;
                                  return (
                                    <SelectItem key={String(c.id)} value={String(c.id)}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                  {form.watch("conta_id") && (
                    <div className="flex items-center gap-3">
                      <Label>Liquidar agora</Label>
                      <input
                        type="checkbox"
                        checked={!!form.watch("data_liquidacao")}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          form.setValue(
                            "data_liquidacao",
                            checked ? new Date().toISOString().slice(0, 10) : null
                          );
                        }}
                      />
                    </div>
                  )}
                  {(() => {
                    const isAporte = form.watch("tipo") === 'APORTE';
                    const origem = form.watch("conta_id") || '';
                    const destino = form.watch("conta_destino_id") || '';
                    const invalidAporte = isAporte && (!origem || !destino || String(origem) === String(destino));
                    return (
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={invalidAporte}>Salvar</Button>
                      </div>
                    );
                  })()}
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
                <SelectTrigger aria-label="Filtrar por tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="RECEITA">Receita</SelectItem>
                  <SelectItem value="DESPESA">Despesa</SelectItem>
                  <SelectItem value="APORTE">Aporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger aria-label="Filtrar por categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  {[...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA, 'Saldo inicial']
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Banco</Label>
              <Select value={filtroContaId} onValueChange={setFiltroContaId}>
                <SelectTrigger aria-label="Filtrar por banco">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todos</SelectItem>
                  {(Array.isArray(contas) ? contas : [])
                    .filter((c) => !!c && !!c.id)
                    .map((c) => {
                      const bank = (c as any).banco_detalhes?.nome_curto || (c as any).banco || '';
                      const label = bank ? `${bank} · ${c.nome}` : `${c.nome}`;
                      return (
                        <SelectItem key={String(c.id)} value={String(c.id)}>{label}</SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Início</Label>
              <Input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fim</Label>
              <Input type="date" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Ordem</Label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                <SelectTrigger aria-label="Ordenar por data">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mais recentes</SelectItem>
                  <SelectItem value="asc">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContasSaldo.map((c) => (
                  <TableRow key={`saldo-${String(c.id)}`}>
                    <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell className="max-w-[320px] truncate" title={`Saldo inicial · ${c.nome}`}>Saldo inicial</TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600 font-semibold">R$ {Number(c.saldo_inicial || 0).toFixed(2)}</span>
                    </TableCell>
                    <TableCell>Receita</TableCell>
                    <TableCell>Saldo inicial</TableCell>
                    <TableCell>
                      <Badge variant="default" className="rounded-full bg-green-600 text-white">
                        Liquidada
                      </Badge>
                    </TableCell>
                    <TableCell>{c.nome}</TableCell>
                    <TableCell>
                      <div className="flex gap-2"></div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.data_vencimento ? row.data_vencimento.split('-').reverse().join('/') : '-'}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate" title={row.descricao}>
                      {row.descricao}
                      {row.agendamento?.projeto?.cliente?.nome && (
                        <span className="text-muted-foreground ml-1">
                          - {row.agendamento.projeto.cliente.nome}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={row.tipo === 'RECEITA' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        R$ {Number(row.valor).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{row.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}</TableCell>
                    <TableCell>{row.categoria}</TableCell>
                    <TableCell>
                      {row.data_liquidacao ? (
                        <Badge variant="default" className="rounded-full bg-green-600 text-white">
                          Liquidada
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full bg-yellow-500 text-white">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{(() => {
                      const conta = (Array.isArray(contas) ? contas : []).find((c) => String(c.id) === String(row.conta_id || ''));
                      return conta ? conta.nome : '-';
                    })()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(row)} aria-label={`Editar ${row.descricao}`}>Editar</Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(row.id!)} aria-label={`Excluir ${row.descricao}`}>Excluir</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(filteredItems.length > 0 || filteredContasSaldo.length > 0) && (
                  <TableRow className="bg-muted/30 font-semibold border-t-2">
                    <TableCell colSpan={2} className="text-right">Total:</TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-green-600">
                          + R$ {(
                            filteredContasSaldo.reduce((acc, c) => acc + Number(c.saldo_inicial || 0), 0) +
                            filteredItems
                              .filter(t => t.tipo === "RECEITA")
                              .reduce((acc, t) => acc + Number(t.valor), 0)
                          ).toFixed(2)}
                        </div>
                        <div className="text-red-600">
                          - R$ {filteredItems
                            .filter(t => t.tipo === "DESPESA")
                            .reduce((acc, t) => acc + Number(t.valor), 0)
                            .toFixed(2)}
                        </div>
                        <div className="border-t pt-1">
                          R$ {(
                            filteredContasSaldo.reduce((acc, c) => acc + Number(c.saldo_inicial || 0), 0) +
                            filteredItems
                              .filter(t => t.tipo === "RECEITA")
                              .reduce((acc, t) => acc + Number(t.valor), 0) -
                            filteredItems
                              .filter(t => t.tipo === "DESPESA")
                              .reduce((acc, t) => acc + Number(t.valor), 0)
                          ).toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell colSpan={5}></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
