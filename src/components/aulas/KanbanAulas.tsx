import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Aula, AulaStatus, useAulas } from "@/hooks/useAulas";
import { AulaCard } from "./AulaCard";
import { AulaEditDialog } from "./AulaEditDialog";
import { FileText, PlayCircle, CheckCircle, Edit3, Sparkles } from "lucide-react";

const columns: { key: AulaStatus; label: string; icon: any }[] = [
  { key: "esboco", label: "Esboço inicial", icon: Sparkles },
  { key: "desenvolvimento", label: "Desenvolvimento", icon: PlayCircle },
  { key: "revisao", label: "Revisão", icon: Edit3 },
  { key: "finalizacao", label: "Finalização", icon: FileText },
  { key: "pronta", label: "Aula pronta", icon: CheckCircle },
];

export function KanbanAulas() {
  const { filtered, updateStatus, updateAula, deleteAula } = useAulas();
  const [editing, setEditing] = useState<Aula | null>(null);

  function handleDragStart(e: React.DragEvent, aulaId: string) {
    e.dataTransfer.setData("text/plain", aulaId);
    e.dataTransfer.effectAllowed = "move";
  }

  function renderColumn(status: AulaStatus) {
    const list = filtered.filter((a) => a.status === status);
    const Icon = columns.find((c) => c.key === status)?.icon;
    return (
      <div
        key={status}
        className="bg-muted/30 rounded-xl p-3 flex flex-col gap-3 min-h-[300px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          if (id) updateStatus(id, status);
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{columns.find((c) => c.key === status)?.label}</span>
          </div>
          <Badge variant="outline" className="text-xs">{list.length}</Badge>
        </div>

        {list.length === 0 ? (
          <div className="text-xs text-muted-foreground py-8 text-center border border-dashed rounded-lg">
            Arraste aulas para cá
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((a) => (
              <div key={a.id} onDragStart={(e) => handleDragStart(e, a.id)}>
                <AulaCard aula={a} onDoubleClick={(x) => setEditing(x)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {columns.map((c) => renderColumn(c.key))}
      <AulaEditDialog open={!!editing} aula={editing} onClose={() => setEditing(null)} onSave={updateAula} onDelete={deleteAula} />
    </div>
  );
}
