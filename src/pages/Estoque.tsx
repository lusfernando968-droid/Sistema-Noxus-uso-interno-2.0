import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MateriaisTable from "@/components/estoque/MateriaisTable";
import ProdutosTable from "@/components/estoque/ProdutosTable";
import AnaliseCusto from "@/components/estoque/AnaliseCusto";
import { useMateriaisEstoque } from "@/hooks/useMateriaisEstoque";
import { Package, DollarSign, AlertTriangle } from "lucide-react";

export default function Estoque() {
  const { items } = useMateriaisEstoque();

  const totalItems = items.length;
  const totalValue = items.reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const custo = Number(item.custo_unitario) || 0;
    return acc + (qtd * custo);
  }, 0);
  const criticalItems = items.filter(i => (Number(i.quantidade) || 0) < 5).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
        <p className="text-muted-foreground">Gestão de materiais e análise de custos do estúdio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Em patrimônio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalItems}</div>
            <p className="text-xs text-muted-foreground">Com estoque baixo (&lt; 5)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="materiais" className="space-y-4">
            <TabsList>
              <TabsTrigger value="materiais">Materiais</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="custo">Análise de Custo</TabsTrigger>
            </TabsList>

            <TabsContent value="materiais" className="space-y-4">
              <MateriaisTable />
            </TabsContent>

            <TabsContent value="produtos" className="space-y-4">
              <ProdutosTable />
            </TabsContent>

            <TabsContent value="custo">
              <AnaliseCusto />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
