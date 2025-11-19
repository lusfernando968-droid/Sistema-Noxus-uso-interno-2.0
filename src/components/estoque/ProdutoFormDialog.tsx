import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { produtoSchema, ProdutoRecord, useProdutos } from "@/hooks/useProdutos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Tag, Layers, Scale } from "lucide-react";
import { useEffect } from "react";

type Props = {
    trigger?: React.ReactNode;
    initial?: ProdutoRecord | null;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export default function ProdutoFormDialog({ trigger, initial, onSuccess, open, onOpenChange }: Props) {
    const { insertProduto, updateProduto } = useProdutos();

    const form = useForm<ProdutoRecord>({
        resolver: zodResolver(produtoSchema),
        defaultValues: {
            nome: "",
            marca: "",
            tipo_material: "",
            unidade: "un",
        },
    });

    useEffect(() => {
        if (initial) {
            form.reset({
                nome: initial.nome,
                marca: initial.marca || "",
                tipo_material: initial.tipo_material,
                unidade: initial.unidade,
            });
        } else {
            form.reset({
                nome: "",
                marca: "",
                tipo_material: "",
                unidade: "un",
            });
        }
    }, [initial, form]);

    const handleSubmit = async (values: ProdutoRecord) => {
        try {
            if (initial && initial.id) {
                await updateProduto(initial.id, values);
            } else {
                await insertProduto(values);
            }
            if (onSuccess) onSuccess();
            if (onOpenChange) onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Package className="h-5 w-5" />
                        {initial ? "Editar Produto" : "Novo Produto"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        {/* Grupo: Informações do Produto */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Package className="h-4 w-4" /> Informações do Produto
                            </h3>
                            <FormField name="nome" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Nome do produto" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField name="marca" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Marca</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Marca (opcional)" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Grupo: Classificação */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Classificação
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="tipo_material" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ex: Tinta, Agulha" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField name="unidade" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidade</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="pl-9">
                                                    <Scale className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="un">un (unidade)</SelectItem>
                                                <SelectItem value="ml">ml (mililitro)</SelectItem>
                                                <SelectItem value="g">g (grama)</SelectItem>
                                                <SelectItem value="kg">kg (quilograma)</SelectItem>
                                                <SelectItem value="cx">cx (caixa)</SelectItem>
                                                <SelectItem value="pct">pct (pacote)</SelectItem>
                                                <SelectItem value="l">l (litro)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit">{initial ? "Salvar Alterações" : "Cadastrar Produto"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
