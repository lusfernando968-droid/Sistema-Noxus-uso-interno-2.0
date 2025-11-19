import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Aula, AulaStatus } from "@/hooks/useAulas";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  aula: Aula | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Aula>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const statusOptions: { value: AulaStatus; label: string }[] = [
  { value: "esboco", label: "Esboço inicial" },
  { value: "desenvolvimento", label: "Desenvolvimento" },
  { value: "revisao", label: "Revisão" },
  { value: "finalizacao", label: "Finalização" },
  { value: "pronta", label: "Aula pronta" },
];

export function AulaEditDialog({ open, aula, onClose, onSave, onDelete }: Props) {
  const [titulo, setTitulo] = useState(aula?.titulo || "");
  const [descricao, setDescricao] = useState(aula?.descricao || "");
  const [status, setStatus] = useState<AulaStatus>(aula?.status || "esboco");
  const [disciplina, setDisciplina] = useState(aula?.disciplina || "");
  const [prazo, setPrazo] = useState(aula?.prazo || "");

  const canSave = aula && titulo.trim().length > 0;

  useEffect(() => {
    setTitulo(aula?.titulo || "");
    setDescricao(aula?.descricao || "");
    setStatus(aula?.status || "esboco");
    setDisciplina(aula?.disciplina || "");
    setPrazo(aula?.prazo || "");
  }, [aula, open]);

  async function handleSave() {
    if (!aula) return;
    const ok = await onSave(aula.id, { titulo, descricao, status, disciplina, prazo });
    if (ok) onClose();
  }

  async function handleDelete() {
    if (!aula) return;
    const ok = await onDelete(aula.id);
    if (ok) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Editar Aula</DialogTitle>
        </DialogHeader>
        {aula ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Título</label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Módulo</label>
                <Input value={disciplina || ""} onChange={(e) => setDisciplina(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as AulaStatus)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Prazo</label>
                <Input type="date" value={prazo || ""} onChange={(e) => setPrazo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Responsável</label>
                <Badge variant="outline" className="rounded-xl">{aula.responsavel_id ? "Definido" : "Sem responsável"}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Descrição / Estrutura</label>
              <Textarea rows={6} value={descricao || ""} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="destructive" onClick={handleDelete} className="rounded-xl">Excluir</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
                <Button onClick={handleSave} disabled={!canSave} className="rounded-xl">Salvar</Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
