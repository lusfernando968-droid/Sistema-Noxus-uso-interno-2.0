import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Users, NotebookPen, Search, Filter, LayoutGrid, Table2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KanbanAulas } from "@/components/aulas/KanbanAulas";
import { AulasList } from "@/components/aulas/AulasList";
import { useAulas } from "@/hooks/useAulas";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CursoMVP() {
  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    disciplinaFilter, setDisciplinaFilter,
    responsavelFilter, setResponsavelFilter,
    createAula,
  } = useAulas();
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Curso MVP</CardTitle>
              <p className="text-sm text-muted-foreground">Gestão do curso e desenvolvimento de aulas</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clientes" className="space-y-6">
            <div className="flex justify-center">
              <TabsList className="inline-flex w-auto rounded-2xl p-1.5 bg-muted/50 shadow-sm">
                <TabsTrigger value="clientes" className="rounded-xl px-4 py-2">
                  <Users className="w-4 h-4 mr-2" /> Clientes do curso
                </TabsTrigger>
                <TabsTrigger value="aulas" className="rounded-xl px-4 py-2">
                  <NotebookPen className="w-4 h-4 mr-2" /> desenvolvimento de aula
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="clientes" className="space-y-4">
              <div className="text-muted-foreground">
                Em breve: listagem e gestão de alunos matriculados, status e métricas.
              </div>
            </TabsContent>

            <TabsContent value="aulas" className="space-y-4">
              <Card className="rounded-2xl">
                <div className="p-4 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por título, descrição ou módulo..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-10 rounded-xl"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="esboco">Esboço</SelectItem>
                            <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                            <SelectItem value="revisao">Revisão</SelectItem>
                            <SelectItem value="finalizacao">Finalização</SelectItem>
                            <SelectItem value="pronta">Pronta</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={disciplinaFilter} onValueChange={setDisciplinaFilter}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Módulo" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Teórica">Teórica</SelectItem>
                            <SelectItem value="Prática">Prática</SelectItem>
                            <SelectItem value="Workshop">Workshop</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Responsável" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="meu">Meus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => setViewMode("kanban")} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${viewMode==='kanban'?'bg-muted':''}`}>
                        <LayoutGrid className="w-4 h-4" /> Kanban
                      </button>
                      <button onClick={() => setViewMode("lista")} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${viewMode==='lista'?'bg-muted':''}`}>
                        <Table2 className="w-4 h-4" /> Lista
                      </button>
                      <Button onClick={() => createAula()} className="rounded-xl gap-2">
                        <Plus className="w-4 h-4" /> Nova Aula
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {search && (<Badge variant="secondary" className="rounded-full">Busca: "{search}"</Badge>)}
                    {statusFilter !== 'all' && (<Badge variant="secondary" className="rounded-full">{String(statusFilter)}</Badge>)}
                    {disciplinaFilter !== 'all' && (<Badge variant="secondary" className="rounded-full">{String(disciplinaFilter)}</Badge>)}
                    {responsavelFilter !== 'all' && (<Badge variant="secondary" className="rounded-full">{String(responsavelFilter)}</Badge>)}
                  </div>
                </div>
              </Card>

              {viewMode === 'kanban' ? (
                <KanbanAulas />
              ) : (
                <AulasList />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
