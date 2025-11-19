import CarteiraTable from "@/components/carteira/CarteiraTable";
import RelatoriosCarteira from "@/components/carteira/RelatoriosCarteira";
import RelatoriosGraficos from "@/components/carteira/RelatoriosGraficos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DockCarteira } from "@/components/carteira/DockCarteira";
import { useState, useEffect } from "react";
import BankBalanceWidget from "@/components/financeiro/BankBalanceWidget";
import TabelaGestaoBancos from "@/components/financeiro/TabelaGestaoBancos";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { useCarteira } from "@/hooks/useCarteira";
import TabelaDividas from "@/components/carteira/TabelaDividas";
import TabelaPatrimonio from "@/components/carteira/TabelaPatrimonio";
import TabelaLinhasCredito from "@/components/carteira/TabelaLinhasCredito";
import {
  Wallet,
  ArrowRightLeft,
  BarChart3,
  Landmark,
  CreditCard,
  AlertCircle,
  Building2
} from "lucide-react";

export default function Carteira() {

  useEffect(() => {
    document.title = "Carteira - Noxus";
  }, []);

  const [activeTab, setActiveTab] = useState("despesas");
  const { items: contas } = useContasBancarias();
  const { items: transacoes } = useCarteira();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carteira</h1>
            <p className="text-muted-foreground">Gestão financeira completa</p>
          </div>
        </div>
      </div>

      <BankBalanceWidget contas={contas} transacoes={transacoes} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start h-auto p-2 bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/50 overflow-x-auto flex-nowrap">
          <TabsTrigger value="despesas" className="gap-2 rounded-xl py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ArrowRightLeft className="w-4 h-4" />
            Fluxo
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2 rounded-xl py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="bancos" className="gap-2 rounded-xl py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Landmark className="w-4 h-4" />
            Bancos
          </TabsTrigger>
          <TabsTrigger value="creditos" className="gap-2 rounded-xl py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4" />
            Crédito
          </TabsTrigger>
          <TabsTrigger value="dividas" className="gap-2 rounded-xl py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <AlertCircle className="w-4 h-4" />
            Dívidas
          </TabsTrigger>
          <TabsTrigger value="patrimonio" className="gap-2 rounded-xl py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4" />
            Patrimônio
          </TabsTrigger>
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
