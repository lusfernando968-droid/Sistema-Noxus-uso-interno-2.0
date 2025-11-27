import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Tag, Megaphone } from "lucide-react";
import { Marca } from "@/hooks/useMarcas";
import { Badge } from "@/components/ui/badge";

interface MarcasTableProps {
    marcas: Marca[];
    onEdit: (marca: Marca) => void;
    onDelete: (id: string) => void;
}

export default function MarcasTable({ marcas, onEdit, onDelete }: MarcasTableProps) {
    if (marcas.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma marca cadastrada</p>
                <p className="text-sm">Clique em "Nova Marca" para adicionar sua primeira marca</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Nome da Marca</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Produto/Serviço</TableHead>
                        <TableHead className="w-[180px]">Campanha Vinculada</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {marcas.map((marca) => (
                        <TableRow key={marca.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    {marca.nome}
                                </div>
                            </TableCell>
                            <TableCell>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {marca.descricao || "-"}
                                </p>
                            </TableCell>
                            <TableCell>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {marca.descricao_produto || "-"}
                                </p>
                            </TableCell>
                            <TableCell>
                                {marca.campanha_nome ? (
                                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                        <Megaphone className="h-3 w-3" />
                                        {marca.campanha_nome}
                                    </Badge>
                                ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(marca)}
                                        className="h-8 w-8"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(marca.id)}
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
