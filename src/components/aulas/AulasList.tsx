import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Aula, useAulas } from "@/hooks/useAulas";
import { useState } from "react";
import { AulaEditDialog } from "./AulaEditDialog";
import { Trash2 } from "lucide-react";

export function AulasList() {
  const { filtered, updateAula, deleteAula } = useAulas();
  const [editing, setEditing] = useState<Aula | null>(null);
  return (
    <Card className="rounded-xl">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aula</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((aula: Aula) => (
              <TableRow key={aula.id} className="cursor-pointer" onClick={() => setEditing(aula)}>
                <TableCell className="font-medium">{aula.titulo}</TableCell>
                <TableCell>{aula.disciplina || "-"}</TableCell>
                <TableCell>{aula.status}</TableCell>
                <TableCell>{aula.prazo ? new Date(aula.prazo).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{aula.responsavel_id ? "Definido" : "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-xl inline-flex items-center gap-2"
                    onClick={(e) => { e.stopPropagation(); deleteAula(aula.id); }}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AulaEditDialog open={!!editing} aula={editing} onClose={() => setEditing(null)} onSave={updateAula} onDelete={deleteAula} />
    </Card>
  );
}
