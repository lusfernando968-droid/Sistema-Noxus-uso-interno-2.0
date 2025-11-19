import CarteiraTable from "@/components/carteira/CarteiraTable";
import RelatoriosCarteira from "@/components/carteira/RelatoriosCarteira";
import RelatoriosGraficos from "@/components/carteira/RelatoriosGraficos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DockCarteira } from "@/components/carteira/DockCarteira";
import { useState } from "react";
import BankBalanceWidget from "@/components/financeiro/BankBalanceWidget";
import TabelaGestaoBancos from "@/components/financeiro/TabelaGestaoBancos";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { useCarteira } from "@/hooks/useCarteira";
import { useEffect } from "react";
import TabelaDividas from "@/components/carteira/TabelaDividas";
import TabelaPatrimonio from "@/components/carteira/TabelaPatrimonio";
import TabelaLinhasCredito from "@/components/carteira/TabelaLinhasCredito";

export default function Carteira() {
  
  useEffect(() => {
    document.title = "Carteira - Noxus";
  }, []);
  
  const [activeTab, setActiveTab] = useState("despesas");
  const { items: contas } = useContasBancarias();
  const { items: transacoes } = useCarteira();

  useEffect(() => {
    document.title = "Carteira - Noxus";
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Carteira</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de carteira específica para tatuagens
          </p>
        </div>
      </div>
      
      <BankBalanceWidget contas={contas} transacoes={transacoes} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-2xl p-1.5 bg-muted/50">
          <TabsTrigger value="despesas" className="rounded-xl">Fluxo</TabsTrigger>
          <TabsTrigger value="relatorios" className="rounded-xl">Relatórios</TabsTrigger>
          <TabsTrigger value="bancos" className="rounded-xl">Bancos</TabsTrigger>
          <TabsTrigger value="creditos" className="rounded-xl">Crédito</TabsTrigger>
          <TabsTrigger value="dividas" className="rounded-xl">Dívidas</TabsTrigger>
          <TabsTrigger value="patrimonio" className="rounded-xl">Patrimônio</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas" className="space-y-4">
          <CarteiraTable />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <RelatoriosGraficos />
          <RelatoriosCarteira />
        </TabsContent>

        <TabsContent value="bancos" className="space-y-4">
          <TabelaGestaoBancos />
        </TabsContent>

        <TabsContent value="creditos" className="space-y-4">
          <TabelaLinhasCredito />
        </TabsContent>

        <TabsContent value="dividas" className="space-y-4">
          <TabelaDividas />
        </TabsContent>

        <TabsContent value="patrimonio" className="space-y-4">
          <TabelaPatrimonio />
        </TabsContent>
      </Tabs>

      <DockCarteira
        activeTab={activeTab as any}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
