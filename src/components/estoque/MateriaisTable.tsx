import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import MaterialFormDialog from "./MaterialFormDialog";
import { useMateriaisEstoque, MaterialRecord } from "@/hooks/useMateriaisEstoque";

export default function MateriaisTable() {
  const { items, insert, update, remove } = useMateriaisEstoque();
  const [typeFilter, setTypeFilter] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [editing, setEditing] = useState<MaterialRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MaterialRecord | null>(null);

  const filtered = items.filter((i) => {
    const typeOk = typeFilter ? i.tipo_material?.toLowerCase().includes(typeFilter.toLowerCase()) : true;
    const d = i.data_aquisicao ? new Date(i.data_aquisicao) : null;
    const startOk = dateStart ? (d ? d >= new Date(dateStart) : false) : true;
    const endOk = dateEnd ? (d ? d <= new Date(dateEnd) : false) : true;
    return typeOk && startOk && endOk;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-2">
          <Input placeholder="Filtrar por tipo" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
          <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
        </div>
        <MaterialFormDialog
          trigger={<Button variant="default">Adicionar material</Button>}
          initial={null}
          onSubmit={async (v) => { await insert(v); }}
        />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data aqu.</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Un</TableHead>
                <TableHead>Custo (R$)</TableHead>
                <TableHead>Total (R$)</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.data_aquisicao}</TableCell>
                  <TableCell>{m.tipo_material}</TableCell>
                  <TableCell>{m.nome}</TableCell>
                  <TableCell>{m.marca}</TableCell>
                  <TableCell>{Number(m.quantidade).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{m.unidade}</TableCell>
                  <TableCell>{Number(m.custo_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{Number(m.valor_total || (Number(m.quantidade) * Number(m.custo_unitario))).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(m)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(m)}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && (
        <MaterialFormDialog
          initial={editing}
          open={!!editing}
          onOpenChange={(o) => { if (!o) setEditing(null); }}
          onSubmit={async (v) => {
            if (editing?.id) await update(editing.id, v);
            setEditing(null);
          }}
        />
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir material</DialogTitle>
          </DialogHeader>
          Tem certeza que deseja excluir "{confirmDelete?.nome}"?
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (confirmDelete?.id) await remove(confirmDelete.id); setConfirmDelete(null); }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
