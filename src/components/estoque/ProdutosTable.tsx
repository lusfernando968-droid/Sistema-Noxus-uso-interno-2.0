import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProdutos, ProdutoRecord } from "@/hooks/useProdutos";
import { Edit, Trash2, Search, Plus, Package } from "lucide-react";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProdutoFormDialog from "./ProdutoFormDialog";

export default function ProdutosTable() {
    const { produtos, loading, deleteProduto } = useProdutos();
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingProduto, setEditingProduto] = useState<ProdutoRecord | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const filteredProdutos = produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (produto.marca && produto.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
        produto.tipo_material.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async () => {
        if (deleteId) {
            await deleteProduto(deleteId);
            setDeleteId(null);
        }
    };

    const handleEdit = (produto: ProdutoRecord) => {
        setEditingProduto(produto);
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setEditingProduto(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={handleNew} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Produto
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Carregando produtos...
                                </TableCell>
                            </TableRow>
                        ) : filteredProdutos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-8 w-8 opacity-50" />
                                        <p>Nenhum produto encontrado.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProdutos.map((produto) => (
                                <TableRow key={produto.id}>
                                    <TableCell className="font-medium">{produto.nome}</TableCell>
                                    <TableCell>{produto.marca || "-"}</TableCell>
                                    <TableCell>{produto.tipo_material}</TableCell>
                                    <TableCell>{produto.unidade}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(produto)}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteId(produto.id!)}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProdutoFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                initial={editingProduto}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto da lista de opções.
                            Os materiais já cadastrados no estoque não serão afetados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
