import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campanhaSchema, CampanhaRecord, CampanhaCanal, CampanhaStatus } from "@/hooks/useCampanhas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: CampanhaRecord) => Promise<void> | void;
  editing?: CampanhaRecord | null;
};

const canais: CampanhaCanal[] = ['INSTAGRAM','FACEBOOK','TIKTOK','GOOGLE_ADS','ORGANICO','EMAIL'];
const statuses: CampanhaStatus[] = ['RASCUNHO','ATIVA','PAUSADA','ENCERRADA'];

export default function CampanhaFormModal({ open, onOpenChange, onSubmit, editing }: Props) {
  const form = useForm<CampanhaRecord>({
    resolver: zodResolver(campanhaSchema as any),
    defaultValues: editing ? editing : {
      titulo: "",
      objetivo: "",
      publico_alvo: "",
      canal: 'INSTAGRAM',
      orcamento: 0,
      data_inicio: new Date().toISOString().slice(0,10),
      data_fim: new Date().toISOString().slice(0,10),
      status: 'RASCUNHO',
      tags: [],
      notas: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar campanha" : "Nova campanha"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (data) => {
            await onSubmit({
              titulo: data.titulo,
              objetivo: data.objetivo ?? null,
              publico_alvo: data.publico_alvo ?? null,
              canal: data.canal,
              orcamento: data.orcamento ?? null,
              data_inicio: data.data_inicio ?? null,
              data_fim: data.data_fim ?? null,
              status: data.status,
              tags: data.tags ?? null,
              notas: data.notas ?? null,
            });
            onOpenChange(false);
          })}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" {...form.register("titulo")} />
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={form.watch("canal")} onValueChange={(v) => form.setValue("canal", v as CampanhaCanal)}>
                <SelectTrigger aria-label="Selecionar canal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {canais.map(c => <SelectItem key={c} value={c}>{c.replace("_"," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Início</Label>
              <Input id="data_inicio" type="date" {...form.register("data_inicio")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim">Fim</Label>
              <Input id="data_fim" type="date" {...form.register("data_fim")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Input id="objetivo" {...form.register("objetivo")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orcamento">Orçamento</Label>
              <Input id="orcamento" type="number" step="0.01" {...form.register("orcamento", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="publico_alvo">Público-alvo</Label>
            <Input id="publico_alvo" {...form.register("publico_alvo")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as CampanhaStatus)}>
                <SelectTrigger aria-label="Selecionar status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" value={(form.watch("tags") || []).join(", ")}
                     onChange={(e) => form.setValue("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Input id="notas" {...form.register("notas")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

