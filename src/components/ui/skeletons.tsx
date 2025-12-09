import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Componentes de Skeleton reutilizáveis
 * 
 * Padrão de loading states consistente em todo o sistema.
 * Use estes componentes para mostrar estados de carregamento
 * que refletem o layout final do conteúdo.
 */

// ============================================================
// SKELETONS GENÉRICOS
// ============================================================

/**
 * Skeleton para cards de estatísticas (métricas no topo das páginas)
 */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton para barra de filtros/controles
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-12 rounded-md" />
        <Skeleton className="h-7 w-12 rounded-md" />
        <Skeleton className="h-7 w-12 rounded-md" />
        <Skeleton className="h-6 w-8 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Skeleton para cabeçalho de página
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

// ============================================================
// SKELETONS DE TABELA
// ============================================================

/**
 * Skeleton para tabela genérica
 */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Card className="rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="border-b p-4">
              <div className="flex gap-4 items-center">
                {Array.from({ length: cols - 1 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-24" />
                ))}
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded-xl" />
                  <Skeleton className="w-8 h-8 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// SKELETONS DE GRID/CARDS
// ============================================================

/**
 * Skeleton para grid de cards genérico
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton para lista de cards
 */
export function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-[220px] space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - PROJETOS
// ============================================================

/**
 * Skeleton para a página de Projetos
 */
export function ProjetosSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Stats */}
      <StatCardsSkeleton count={5} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Content */}
      <CardGridSkeleton count={6} />
    </div>
  );
}

/**
 * Skeleton para Kanban de projetos
 */
export function ProjetosKanbanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {["Planejamento", "Em Andamento", "Concluído", "Cancelado"].map((status, i) => (
        <div key={i} className="bg-muted/30 rounded-xl p-3 flex flex-col gap-3 min-h-[300px]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {Array.from({ length: 2 }).map((_, j) => (
            <Card key={j} className="rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - AGENDAMENTOS
// ============================================================

/**
 * Skeleton para a página de Agendamentos
 */
export function AgendamentosSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeaderSkeleton />
        </div>

        {/* Métricas */}
        <StatCardsSkeleton count={4} />

        {/* Agendamentos de Hoje */}
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border bg-card p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-xl" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex w-auto rounded-2xl bg-muted/30 p-1.5">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-10 w-48 rounded-xl ml-2" />
          </div>
        </div>

        {/* Filtros */}
        <FilterBarSkeleton />

        {/* Calendário Skeleton */}
        <Card className="rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de agendamentos
 */
export function AgendamentosListSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        <TableSkeleton rows={8} cols={7} />
      </CardContent>
    </Card>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - CLIENTES (já existentes, re-exportados)
// ============================================================

// Estes são exportados de ClientesSkeleton.tsx, mas podemos re-exportar aqui
// para centralizar ou criar variantes adicionais

/**
 * Skeleton para página de Clientes completa
 */
export function ClientesPageSkeleton() {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Stats */}
      <StatCardsSkeleton count={4} />

      {/* Tabs */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex w-auto rounded-2xl bg-muted/30 p-1.5">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl ml-2" />
          <Skeleton className="h-10 w-24 rounded-xl ml-2" />
          <Skeleton className="h-10 w-24 rounded-xl ml-2" />
        </div>
      </div>

      {/* Filtros */}
      <FilterBarSkeleton />

      {/* Tabela */}
      <TableSkeleton rows={8} cols={8} />
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - FINANCEIRO
// ============================================================

/**
 * Skeleton para a página de Financeiro
 */
export function FinanceiroSkeleton() {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
      </div>

      {/* Stats */}
      <StatCardsSkeleton count={4} />

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="inline-flex w-auto rounded-2xl bg-muted/30 p-1.5">
            <Skeleton className="h-10 w-20 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl ml-2" />
            <Skeleton className="h-10 w-16 rounded-xl ml-2" />
            <Skeleton className="h-10 w-20 rounded-xl ml-2" />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Tabela */}
        <TableSkeleton rows={8} cols={8} />
      </div>
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - CARTEIRA
// ============================================================

/**
 * Skeleton para a página de Carteira
 */
export function CarteiraSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Bank Balance Widget */}
      <Card className="p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="w-full h-auto p-2 bg-muted/30 rounded-2xl border border-border/50 flex gap-2">
          {["Fluxo", "Relatórios", "Bancos", "Crédito", "Dívidas", "Patrimônio"].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-xl" />
          ))}
        </div>

        {/* Tabela */}
        <TableSkeleton rows={8} cols={6} />
      </div>
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - ESTOQUE
// ============================================================

/**
 * Skeleton para a página de Estoque
 */
export function EstoqueSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Card with Tabs */}
      <Card className="rounded-xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <TableSkeleton rows={6} cols={5} />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - MARKETING
// ============================================================

/**
 * Skeleton para a página de Marketing
 */
export function MarketingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </Card>
            ))}
          </div>

          {/* Table */}
          <TableSkeleton rows={6} cols={5} />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - DASHBOARD
// ============================================================

/**
 * Skeleton para a página de Dashboard (Index)
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeaderSkeleton />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-2xl" />
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl p-1.5 bg-muted/50 inline-flex gap-1">
        {["Visão Geral", "Insights", "Metas", "Clientes", "Projetos", "Agendamentos", "Financeiro"].map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-xl" />
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// SKELETONS ESPECÍFICOS - PÁGINAS DE DETALHES
// ============================================================

/**
 * Skeleton para a página de detalhes do cliente
 */
export function ClienteDetalhesSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl w-fit">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>

        {/* Info Card */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-32 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Skeleton para a página de detalhes do projeto
 */
export function ProjetoDetalhesSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-xl" />
            <Skeleton className="h-6 w-28 rounded-xl" />
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="grid w-full grid-cols-5 gap-1 bg-muted/30 p-1 rounded-2xl">
            {["Detalhes", "Sessões", "Feedbacks", "Financeiro", "Galeria"].map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-xl" />
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
                <Skeleton className="h-9 w-full rounded-xl" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-40 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// SKELETON GENÉRICO DE LOADING PAGE
// ============================================================

/**
 * Skeleton de página genérica - use quando não há skeleton específico
 */
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <FilterBarSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}

