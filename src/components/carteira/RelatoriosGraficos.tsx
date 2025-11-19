import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCarteira } from "@/hooks/useCarteira"
import { useContasBancarias, ContaBancariaRecord } from "@/hooks/useContasBancarias"
import { calcularSaldoConta } from "@/utils/saldoPorConta"
import { format, parseISO } from "date-fns"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type TipoFiltro = "TODOS" | "RECEITA" | "DESPESA"

export default function RelatoriosGraficos() {
  const { items: tx } = useCarteira()
  const { items: contas } = useContasBancarias()

  const [inicio, setInicio] = useState<string>(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
  const [fim, setFim] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [tipo, setTipo] = useState<TipoFiltro>("TODOS")
  const [contaId, setContaId] = useState<string>("ALL")

  const filtradas = useMemo(() => {
    const start = new Date(inicio)
    const end = new Date(fim)
    return (tx || [])
      .filter((t) => !!t.data_liquidacao)
      .filter((t) => {
        const d = parseISO(String(t.data_liquidacao))
        return d >= start && d <= end
      })
      .filter((t) => (tipo === "TODOS" ? true : t.tipo === tipo))
      .filter((t) => (contaId === "ALL" ? true : String(t.conta_id || "") === contaId))
  }, [tx, inicio, fim, tipo, contaId])

  const porMes = useMemo(() => {
    const map: Record<string, { mes: string; receita: number; despesa: number }> = {}
    filtradas.forEach((t) => {
      const key = format(parseISO(String(t.data_liquidacao)), "yyyy-MM")
      if (!map[key]) map[key] = { mes: key, receita: 0, despesa: 0 }
      if (t.tipo === "RECEITA") map[key].receita += Number(t.valor || 0)
      else map[key].despesa += Number(t.valor || 0)
    })
    return Object.values(map).sort((a, b) => a.mes.localeCompare(b.mes))
  }, [filtradas])

  const fluxoAcumulado = useMemo(() => {
    const arr = [...filtradas].sort((a, b) => String(a.data_liquidacao!).localeCompare(String(b.data_liquidacao!)))
    let saldo = 0
    return arr.map((t) => {
      saldo += t.tipo === "RECEITA" ? Number(t.valor || 0) : -Number(t.valor || 0)
      return { data: String(t.data_liquidacao), saldo }
    })
  }, [filtradas])

  const porCategoria = useMemo(() => {
    const m: Record<string, number> = {}
    filtradas.forEach((t) => {
      const k = String(t.categoria || "Sem categoria")
      m[k] = (m[k] || 0) + Number(t.valor || 0) * (t.tipo === "DESPESA" ? 1 : 1)
    })
    const out = Object.entries(m).map(([categoria, valor]) => ({ categoria, valor }))
    out.sort((a, b) => b.valor - a.valor)
    return out.slice(0, 10)
  }, [filtradas])

  const saldosPorConta = useMemo(() => {
    const data = (contas || []).map((c: ContaBancariaRecord) => {
      const s = calcularSaldoConta(String(c.id), contas, filtradas as any)
      return { nome: c.nome, saldo: s.saldoAtual }
    })
    return data.sort((a, b) => b.saldo - a.saldo)
  }, [contas, filtradas])

  const cores = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#F97316", "#22C55E", "#EAB308", "#06B6D4"]

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">Início</Label>
              <Input id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Fim</Label>
              <Input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFiltro)}>
                <SelectTrigger aria-label="Filtrar tipo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="RECEITA">Receita</SelectItem>
                  <SelectItem value="DESPESA">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={contaId} onValueChange={(v) => setContaId(v)}>
                <SelectTrigger aria-label="Filtrar conta"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {(contas || []).map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Evolução Receita vs Despesa</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="#10B981" name="Receita" />
                <Line type="monotone" dataKey="despesa" stroke="#EF4444" name="Despesa" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Fluxo de Caixa Acumulado</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={fluxoAcumulado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tickFormatter={(d) => format(parseISO(d), "MM/dd")} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="saldo" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Top Categorias</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={porCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" hide={false} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Saldo por Conta</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={saldosPorConta}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="saldo" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Participação por Categoria</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={porCategoria} dataKey="valor" nameKey="categoria" outerRadius={80}>
                  {porCategoria.map((_, i) => (
                    <Cell key={i} fill={cores[i % cores.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
