import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CampanhaStats from "@/components/marketing/campanha/CampanhaStats";
import CampanhaTable from "@/components/marketing/campanha/CampanhaTable";
import BrandingStats from "@/components/marketing/branding/BrandingStats";
import BrandingGallery from "@/components/marketing/branding/BrandingGallery";
import BrandingFormModal from "@/components/marketing/branding/BrandingFormModal";
import { useBranding } from "@/hooks/useBranding";
import ConteudoStats from "@/components/marketing/conteudo/ConteudoStats";
import ConteudoTable from "@/components/marketing/conteudo/ConteudoTable";
import ConteudoFormModal from "@/components/marketing/conteudo/ConteudoFormModal";
import { useConteudo } from "@/hooks/useConteudo";
import AnuncioStats from "@/components/marketing/anuncio/AnuncioStats";
import AnuncioTable from "@/components/marketing/anuncio/AnuncioTable";
import AnuncioFormModal from "@/components/marketing/anuncio/AnuncioFormModal";
import { useAnuncios } from "@/hooks/useAnuncios";

export default function Marketing() {
  const { assets, loading: loadingBranding, addAsset, deleteAsset } = useBranding();
  const { items, loading: loadingConteudo, addItem, updateItem, deleteItem } = useConteudo();
  const { items: anuncios, loading: loadingAnuncios, addItem: addAnuncio, updateItem: updateAnuncio, deleteItem: deleteAnuncio } = useAnuncios();

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
              <div className="mt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Ativos da Marca</h3>
                  <BrandingFormModal onSave={addAsset} />
                </div>
                {loadingBranding ? (
                  <div className="text-center py-10">Carregando...</div>
                ) : (
                  <>
                    <BrandingStats assets={assets} />
                    <BrandingGallery assets={assets} onDelete={deleteAsset} />
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="producao">
              <div className="mt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Calendário de Conteúdo</h3>
                  <ConteudoFormModal onSave={addItem} />
                </div>
                {loadingConteudo ? (
                  <div className="text-center py-10">Carregando...</div>
                ) : (
                  <>
                    <ConteudoStats items={items} />
                    <ConteudoTable
                      items={items}
                      onDelete={deleteItem}
                      onStatusChange={(id, status) => updateItem(id, { status })}
                    />
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="anuncio">
              <div className="mt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Gerenciamento de Anúncios</h3>
                  <AnuncioFormModal onSave={addAnuncio} />
                </div>
                {loadingAnuncios ? (
                  <div className="text-center py-10">Carregando...</div>
                ) : (
                  <>
                    <AnuncioStats items={anuncios} />
                    <AnuncioTable
                      items={anuncios}
                      onDelete={deleteAnuncio}
                      onStatusChange={(id, status) => updateAnuncio(id, { status })}
                    />
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
