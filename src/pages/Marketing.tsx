import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CampanhaStats from "@/components/marketing/campanha/CampanhaStats";
import CampanhaTable from "@/components/marketing/campanha/CampanhaTable";
import BrandingStats from "@/components/marketing/branding/BrandingStats";
import BrandingGallery from "@/components/marketing/branding/BrandingGallery";
import BrandingFormModal from "@/components/marketing/branding/BrandingFormModal";
import { useBranding } from "@/hooks/useBranding";
import MarcaFormModal from "@/components/marketing/branding/MarcaFormModal";
import MarcasTable from "@/components/marketing/branding/MarcasTable";
import { useMarcas } from "@/hooks/useMarcas";
import ConteudoStats from "@/components/marketing/conteudo/ConteudoStats";
import ConteudoTable from "@/components/marketing/conteudo/ConteudoTable";
import ConteudoFormModal from "@/components/marketing/conteudo/ConteudoFormModal";
import { useConteudo } from "@/hooks/useConteudo";
import ConteudoKanban from "@/components/marketing/conteudo/ConteudoKanban";
import ConteudoCalendar from "@/components/marketing/conteudo/ConteudoCalendar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AnuncioStats from "@/components/marketing/anuncio/AnuncioStats";
import AnuncioTable from "@/components/marketing/anuncio/AnuncioTable";
import AnuncioFormModal from "@/components/marketing/anuncio/AnuncioFormModal";
import { useAnuncios } from "@/hooks/useAnuncios";
import { MarketingSkeleton, TableSkeleton } from "@/components/ui/skeletons";

import { ConteudoItem } from "@/hooks/useConteudo";
import { Marca } from "@/hooks/useMarcas";
import { Plus } from "lucide-react";

export default function Marketing() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const { assets, loading: loadingBranding, addAsset, deleteAsset, uploadImage } = useBranding();
  const { marcas, loading: loadingMarcas, addMarca, updateMarca, deleteMarca } = useMarcas();
  const { items, loading: loadingConteudo, addItem, updateItem, deleteItem } = useConteudo();
  const { items: anuncios, loading: loadingAnuncios, addItem: addAnuncio, updateItem: updateAnuncio, deleteItem: deleteAnuncio } = useAnuncios();

  const [editingConteudo, setEditingConteudo] = useState<ConteudoItem | null>(null);
  const [isConteudoModalOpen, setIsConteudoModalOpen] = useState(false);

  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);

  const handleSaveConteudo = async (data: any) => {
    if (editingConteudo) {
      await updateItem(editingConteudo.id, data);
    } else {
      await addItem(data);
    }
    setIsConteudoModalOpen(false);
  };

  const handleSaveMarca = async (data: any) => {
    if (editingMarca) {
      await updateMarca(editingMarca.id, data);
    } else {
      await addMarca(data);
    }
    setIsMarcaModalOpen(false);
    setEditingMarca(null);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40">
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
              <div className="mt-4 space-y-8">
                {/* Seção de Marcas */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Marcas</h3>
                    <Button onClick={() => {
                      setEditingMarca(null);
                      setIsMarcaModalOpen(true);
                    }} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Marca
                    </Button>
                  </div>
                  {loadingMarcas ? (
                    <TableSkeleton rows={4} cols={4} />
                  ) : (
                    <MarcasTable
                      marcas={marcas}
                      onEdit={(marca) => {
                        setEditingMarca(marca);
                        setIsMarcaModalOpen(true);
                      }}
                      onDelete={deleteMarca}
                    />
                  )}
                </div>

                <MarcaFormModal
                  open={isMarcaModalOpen}
                  onOpenChange={setIsMarcaModalOpen}
                  onSave={handleSaveMarca}
                  editing={editingMarca}
                />

                {/* Seção de Ativos da Marca */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Ativos da Marca</h3>
                    <BrandingFormModal onSave={addAsset} onUpload={uploadImage} />
                  </div>
                  {loadingBranding ? (
                    <TableSkeleton rows={4} cols={4} />
                  ) : (
                    <>
                      <BrandingStats assets={assets} />
                      <BrandingGallery assets={assets} onDelete={deleteAsset} />
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="producao">
              <div className="mt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">Conteúdo</h3>
                    <div className="flex items-center p-1 bg-muted rounded-lg border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-3 text-xs hover:bg-transparent ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setViewMode('list')}
                      >
                        Lista
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-3 text-xs hover:bg-transparent ${viewMode === 'kanban' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setViewMode('kanban')}
                      >
                        Kanban
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-3 text-xs hover:bg-transparent ${viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setViewMode('calendar')}
                      >
                        Calendário
                      </Button>
                    </div>
                  </div>
                  <Button onClick={() => {
                    setEditingConteudo(null);
                    setIsConteudoModalOpen(true);
                  }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Conteúdo
                  </Button>
                </div>

                <ConteudoFormModal
                  open={isConteudoModalOpen}
                  onOpenChange={setIsConteudoModalOpen}
                  itemToEdit={editingConteudo}
                  onSave={handleSaveConteudo}
                />

                {loadingConteudo ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : (
                  <>
                    <ConteudoStats items={items} />

                    {viewMode === 'list' && (
                      <ConteudoTable
                        items={items}
                        onDelete={deleteItem}
                        onStatusChange={(id, status) => updateItem(id, { status })}
                        onEdit={(item) => {
                          setEditingConteudo(item);
                          setIsConteudoModalOpen(true);
                        }}
                      />
                    )}

                    {viewMode === 'kanban' && (
                      <ConteudoKanban
                        items={items}
                        onDelete={deleteItem}
                        onStatusChange={(id, status) => updateItem(id, { status })}
                        onEdit={(item) => {
                          setEditingConteudo(item);
                          setIsConteudoModalOpen(true);
                        }}
                      />
                    )}

                    {viewMode === 'calendar' && (
                      <ConteudoCalendar
                        items={items}
                        onDateChange={(id, date) => updateItem(id, { data_agendamento: date.toISOString() })}
                        onEdit={(item) => {
                          setEditingConteudo(item);
                          setIsConteudoModalOpen(true);
                        }}
                      />
                    )}
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
                  <TableSkeleton rows={4} cols={5} />
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
