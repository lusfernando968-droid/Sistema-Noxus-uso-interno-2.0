import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CampanhaStats from "@/components/marketing/campanha/CampanhaStats";
import CampanhaTable from "@/components/marketing/campanha/CampanhaTable";

export default function Marketing() {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-xl">Marketing</CardTitle>
              <p className="text-sm text-muted-foreground">Planeje e acompanhe as iniciativas de marketing do estúdio</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campanha">
            <TabsList>
              <TabsTrigger value="campanha" aria-label="Campanha">Campanha</TabsTrigger>
              <TabsTrigger value="branding" aria-label="Branding">Branding</TabsTrigger>
              <TabsTrigger value="producao" aria-label="Produção de conteúdo">Produção de conteúdo</TabsTrigger>
              <TabsTrigger value="anuncio" aria-label="Anúncio">Anúncio</TabsTrigger>
            </TabsList>

            <TabsContent value="campanha">
              <div className="mt-4">
                <CampanhaStats />
                <CampanhaTable />
              </div>
            </TabsContent>

            <TabsContent value="branding">
              <div className="mt-4">
                {/* conteúdo futuro da aba Branding */}
              </div>
            </TabsContent>

            <TabsContent value="producao">
              <div className="mt-4">
                {/* conteúdo futuro da aba Produção de conteúdo */}
              </div>
            </TabsContent>

            <TabsContent value="anuncio">
              <div className="mt-4">
                {/* conteúdo futuro da aba Anúncio */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
