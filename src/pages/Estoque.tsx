import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MateriaisTable from "@/components/estoque/MateriaisTable";

export default function Estoque() {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-xl">Estoque</CardTitle>
              <p className="text-sm text-muted-foreground">Gestão de materiais e análise de custos do estúdio</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="materiais">
            <TabsList>
              <TabsTrigger value="materiais" aria-label="Materiais">Materiais</TabsTrigger>
              <TabsTrigger value="custo" aria-label="Análise de custo">Análise de custo</TabsTrigger>
            </TabsList>

            <TabsContent value="materiais">
              <div className="mt-4 space-y-4">
                <MateriaisTable />
              </div>
            </TabsContent>

            <TabsContent value="custo">
              <div className="mt-4 space-y-4">
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
