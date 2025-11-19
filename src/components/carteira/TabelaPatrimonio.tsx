import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePatrimonio, PatrimonioItem, patrimonioItemSchema, calcularValorAtual } from "@/hooks/usePatrimonio";

const CATEGORIAS = [
  "Roupas",
  "Acessórios",
  "Tecnologia",
  "Produtos",
  "Imóvel",
  "Veículo",
  "Empresa",
  "Colecionável",
  "Marca",
  "Outro",
];

const VIDA_UTIL_DEFAULTS: Record<string, number> = {
  Tecnologia: 36,
  Veículo: 60,
  Roupas: 24,
  Marca: 36,
};

type FormValues = Omit<PatrimonioItem, "id" | "user_id" | "created_at" | "updated_at">;

export default function TabelaPatrimonio() {
  const { items, insertItem, updateItem, removeItem, stats } = usePatrimonio();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<PatrimonioItem | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [filtroStatusGrafico, setFiltroStatusGrafico] = useState<string>("todos");
  const [showPie, setShowPie] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(patrimonioItemSchema as any),
    defaultValues: {
      nome: "",
      categoria: "Outro",
      descricao: "",
      data_aquisicao: new Date().toISOString().slice(0, 10),
      custo_inicial: 0,
      valor_residual: 0,
      metodo_depreciacao: "linha_reta",
      vida_util_meses: 36,
      taxa_declinante_anual: null,
      localizacao: "",
      condicao: "bom",
      serial_nota: "",
      garantia_fim: null,
      rendimento_mensal_estimado: null,
      tags: [],
      status: "ativo",
      valor_atual_cache: null,
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      nome: "",
      categoria: "Outro",
      descricao: "",
      data_aquisicao: new Date().toISOString().slice(0, 10),
      custo_inicial: 0,
      valor_residual: 0,
      metodo_depreciacao: "linha_reta",
      vida_util_meses: 36,
      taxa_declinante_anual: null,
      localizacao: "",
      condicao: "bom",
      serial_nota: "",
      garantia_fim: null,
      rendimento_mensal_estimado: null,
      tags: [],
      status: "ativo",
      valor_atual_cache: null,
      metrificar_roi: true as any,
    });
    setIsOpen(true);
  };

  const openEdit = (row: PatrimonioItem) => {
    setEditing(row);
    form.reset({
      nome: row.nome,
      categoria: row.categoria,
      descricao: row.descricao || "",
      data_aquisicao: row.data_aquisicao,
      custo_inicial: Number(row.custo_inicial) || 0,
      valor_residual: Number(row.valor_residual || 0) || 0,
      metodo_depreciacao: row.metodo_depreciacao,
      vida_util_meses: Number(row.vida_util_meses || 36),
      taxa_declinante_anual: (row.taxa_declinante_anual as any) ?? null,
      localizacao: row.localizacao || "",
      condicao: (row.condicao as any) || "bom",
      serial_nota: row.serial_nota || "",
      garantia_fim: row.garantia_fim || null,
      rendimento_mensal_estimado: (row.rendimento_mensal_estimado as any) ?? null,
      tags: (row.tags as any) ?? [],
      status: (row.status as any) || "ativo",
      valor_atual_cache: (row.valor_atual_cache as any) ?? null,
      metrificar_roi: (!Array.isArray(row.tags) || !row.tags?.includes('no_roi')) as any,
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload: PatrimonioItem = {
      nome: data.nome,
      categoria: data.categoria,
      descricao: data.descricao || null,
      data_aquisicao: data.data_aquisicao,
      custo_inicial: Number(data.custo_inicial) || 0,
      valor_residual: Number(data.valor_residual || 0) || 0,
      metodo_depreciacao: data.metodo_depreciacao,
      vida_util_meses: Number(data.vida_util_meses || 36),
      taxa_declinante_anual: data.taxa_declinante_anual ? Number(data.taxa_declinante_anual) : null,
      localizacao: data.localizacao || null,
      condicao: data.condicao as any,
      serial_nota: data.serial_nota || null,
      garantia_fim: data.garantia_fim || null,
      rendimento_mensal_estimado: data.rendimento_mensal_estimado ? Number(data.rendimento_mensal_estimado) : null,
      tags: (() => {
        const arr = (data.tags || []).filter((t) => t !== 'no_roi');
        const metric = (data as any).metrificar_roi !== false;
        return metric ? arr : [...arr, 'no_roi'];
      })(),
      status: data.status as any,
      valor_atual_cache: data.valor_atual_cache != null ? Number(data.valor_atual_cache) : null,
    };
    if (editing?.id) {
      await updateItem(editing.id, payload);
    } else {
      await insertItem(payload);
    }
    setIsOpen(false);
  };

  const filtrados = useMemo(() => {
    return items
      .filter(i => filtroCategoria === "todos" ? true : i.categoria === filtroCategoria)
      .filter(i => !busca || i.nome.toLowerCase().includes(busca.toLowerCase()));
  }, [items, filtroCategoria, busca]);

  const categoriaData = useMemo(() => {
    const m: Record<string, number> = {};
    filtrados
      .filter((row) => filtroStatusGrafico === "todos" ? true : String(row.status || "") === filtroStatusGrafico)
      .forEach((row) => {
      const k = String(row.categoria || "Outro");
      const v = Number(row.valor_atual_cache ?? calcularValorAtual(row));
      m[k] = (m[k] || 0) + v;
    });
    return Object.entries(m).map(([categoria, valor]) => ({ categoria, valor }));
  }, [filtrados, filtroStatusGrafico]);

  const cores = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#14B8A6","#F97316","#22C55E","#EAB308","#06B6D4"];

  return (
    <Card className="rounded-3xl border border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Patrimônio</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={openCreate} aria-label="Adicionar item">Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar item" : "Novo item de patrimônio"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" {...form.register("nome")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={form.watch("categoria")} onValueChange={(v) => {
                      form.setValue("categoria", v);
                      const def = VIDA_UTIL_DEFAULTS[v] ?? 36;
                      form.setValue("vida_util_meses", def, { shouldDirty: true, shouldValidate: true });
                    }}>
                      <SelectTrigger aria-label="Selecionar categoria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_aquisicao">Aquisição</Label>
                    <Input id="data_aquisicao" type="date" {...form.register("data_aquisicao")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custo_inicial">Custo inicial</Label>
                    <Input id="custo_inicial" type="number" step="0.01" {...form.register("custo_inicial", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_residual">Valor atual</Label>
                    <Input id="valor_residual" type="number" step="0.01" {...form.register("valor_residual", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Método</Label>
                    <Select value={form.watch("metodo_depreciacao")} onValueChange={(v) => form.setValue("metodo_depreciacao", v as any)}>
                      <SelectTrigger aria-label="Selecionar método">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linha_reta">Linha reta</SelectItem>
                        <SelectItem value="declinante">Declinante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vida_util_meses">Vida útil (meses)</Label>
                    <Input id="vida_util_meses" type="number" min={1} step={1} {...form.register("vida_util_meses", { valueAsNumber: true })} />
                  </div>
                  {form.watch("metodo_depreciacao") === "declinante" && (
                    <div className="space-y-2">
                      <Label htmlFor="taxa_declinante_anual">Taxa declinante (% anual)</Label>
                      <Input id="taxa_declinante_anual" type="number" step="0.01" {...form.register("taxa_declinante_anual", { valueAsNumber: true })} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.watch("status") as any} onValueChange={(v) => form.setValue("status", v as any)}>
                      <SelectTrigger aria-label="Selecionar status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="vendido">Vendido</SelectItem>
                        <SelectItem value="descartado">Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_atual_cache">Valor atual (manual)</Label>
                    <Input id="valor_atual_cache" type="number" step="0.01" {...form.register("valor_atual_cache", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Checkbox
                      checked={Boolean(form.watch("metrificar_roi"))}
                      onCheckedChange={(checked) => form.setValue("metrificar_roi" as any, Boolean(checked) as any)}
                      id="metrificar_roi"
                    />
                    <Label htmlFor="metrificar_roi">Metrificar ROI</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPie((v) => !v)} aria-label="Mostrar gráfico">
              {showPie ? "Ocultar gráfico" : "Mostrar gráfico"}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="w-48">
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger aria-label="Filtrar categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas categorias</SelectItem>
                {CATEGORIAS.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Input className="max-w-xs" placeholder="Buscar por nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 border rounded-xl">
            <p className="text-2xl font-bold text-primary">R$ {stats.valorAtualTotal.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Valor Atual</p>
          </div>
          <div className="text-center p-4 border rounded-xl">
            <p className="text-2xl font-bold">R$ {stats.custoTotal.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Custo Total</p>
          </div>
          <div className="text-center p-4 border rounded-xl">
            {(() => {
              const custo = stats.custoRoiTotal || 0;
              const roi = custo ? (stats.valorAtualRoiTotal - stats.custoRoiTotal) / custo : 0;
              const pct = (roi * 100).toFixed(2);
              return <>
                <p className={roi >= 0 ? "text-2xl font-bold text-green-600" : "text-2xl font-bold text-red-600"}>{pct}%</p>
                <p className="text-sm text-muted-foreground">ROI médio</p>
              </>;
            })()}
          </div>
        </div>
        {showPie && (
          <Card className="rounded-xl mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Distribuição por Categoria</CardTitle>
                <div className="w-48">
                  <Select value={filtroStatusGrafico} onValueChange={setFiltroStatusGrafico}>
                    <SelectTrigger aria-label="Filtrar status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                      <SelectItem value="descartado">Descartado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={categoriaData} dataKey="valor" nameKey="categoria" outerRadius={80}>
                    {categoriaData.map((_, i) => (
                      <Cell key={i} fill={cores[i % cores.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <div className="overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Valor atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[320px] truncate" title={row.nome}>{row.nome}</TableCell>
                  <TableCell>{row.categoria}</TableCell>
                  <TableCell className="text-right">R$ {Number(row.custo_inicial).toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {Number(row.valor_atual_cache ?? calcularValorAtual(row)).toFixed(2)}</TableCell>
                  <TableCell>{row.status === "ativo" ? "Ativo" : (row.status === "vendido" ? "Vendido" : "Descartado")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)} aria-label={`Editar ${row.nome}`}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => removeItem(row.id!)} aria-label={`Excluir ${row.nome}`}>Excluir</Button>
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
