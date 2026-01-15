import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FolderOpen, Check, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/utils/formatters";
import { ClienteStatusBadge } from "./ClienteStatusBadge";
import type { Cliente, ClienteComLTV } from "@/hooks/useClientes";

interface ClienteCardsProps {
  sortedClientes: ClienteComLTV[];
  maxLTV: number;
  editingRows: Set<string>;
  editedData: Record<string, Partial<Cliente>>;
  startEditing: (clienteId: string, cliente: Cliente) => void;
  cancelEditing: (clienteId: string) => void;
  saveEdit: (clienteId: string) => void;
  updateEditedData: (clienteId: string, field: keyof Cliente, value: string) => void;
  deleteCliente: (id: string) => void;
}

export function ClienteCards({
  sortedClientes,
  maxLTV,
  editingRows,
  editedData,
  startEditing,
  cancelEditing,
  saveEdit,
  updateEditedData,
  deleteCliente
}: ClienteCardsProps) {
  const navigate = useNavigate();
  const { colorTheme } = useTheme();

  const strongAccentThemes = ["ocean", "sunset", "forest", "purple", "rose"];
  const hoverClass = strongAccentThemes.includes(colorTheme) ? "hover:bg-muted/20" : "hover:bg-muted/30";

  const handleKeyDownSave = (clienteId: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(clienteId);
    }
  };

  if (sortedClientes.length === 0) {
    return (
      <Card className="p-12 rounded-xl">
        <div className="text-center text-muted-foreground">
          <p>Nenhum cliente encontrado.</p>
          <p className="text-sm mt-1">Clique em "Novo Cliente" para começar.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedClientes.map(cliente => {
        const isEditing = editingRows.has(cliente.id);
        const editData = editedData[cliente.id] || cliente;

        return (
          <Card
            key={cliente.id}
            className={`p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer ${hoverClass} transition-colors`}
            onDoubleClick={() => startEditing(cliente.id, cliente)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editData.nome || ""}
                          onChange={e => updateEditedData(cliente.id, 'nome', e.target.value)}
                          onKeyDown={handleKeyDownSave(cliente.id)}
                          className="rounded-xl h-9"
                          placeholder="Nome"
                        />
                        <Input
                          type="email"
                          value={editData.email || ""}
                          onChange={e => updateEditedData(cliente.id, 'email', e.target.value)}
                          onKeyDown={handleKeyDownSave(cliente.id)}
                          className="rounded-xl h-9"
                          placeholder="Email"
                        />
                        <Input
                          value={editData.telefone || ""}
                          onChange={e => updateEditedData(cliente.id, 'telefone', e.target.value)}
                          onKeyDown={handleKeyDownSave(cliente.id)}
                          className="rounded-xl h-9"
                          placeholder="Telefone"
                        />
                        <Input
                          value={(editData as any).instagram || ""}
                          onChange={e => updateEditedData(cliente.id, 'instagram' as any, e.target.value)}
                          onKeyDown={handleKeyDownSave(cliente.id)}
                          className="rounded-xl h-9"
                          placeholder="Instagram (link)"
                        />
                        <Input
                          value={(editData as any).cidade || ""}
                          onChange={e => updateEditedData(cliente.id, 'cidade' as any, e.target.value)}
                          onKeyDown={handleKeyDownSave(cliente.id)}
                          className="rounded-xl h-9"
                          placeholder="Cidade"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg">{cliente.nome}</h3>
                        <p className="text-sm text-muted-foreground">{cliente.email}</p>
                        <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                      </>
                    )}
                  </div>
                  <ClienteStatusBadge status={cliente.status || 'lead'} />
                </div>

                {!isEditing && (
                  <div className="space-y-2">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{cliente.projetos_count} projeto(s)</span>
                      <span>•</span>
                      <span>{cliente.transacoes_count} transação(ões)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-8 w-8 text-success"
                      onClick={() => saveEdit(cliente.id)}
                      title="Salvar"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-8 w-8"
                      onClick={() => cancelEditing(cliente.id)}
                      title="Cancelar"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-8 w-8"
                      onClick={() => navigate(`/projetos?cliente=${cliente.id}`)}
                    >
                      <FolderOpen className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-8 w-8 text-destructive"
                      onClick={() => deleteCliente(cliente.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

