import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, FileText, Package, Megaphone } from "lucide-react";
import { MarcaInput } from "@/hooks/useMarcas";
import { useCampanhas } from "@/hooks/useCampanhas";
import { useEffect } from "react";

interface MarcaFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (marca: MarcaInput) => Promise<void>;
    editing?: { id: string } & MarcaInput;
}

const marcaSchema = z.object({
    nome: z.string().min(1, "Nome da marca é obrigatório"),
    descricao: z.string().optional(),
    descricao_produto: z.string().optional(),
    campanha_id: z.string().optional().nullable(),
});

type MarcaFormData = z.infer<typeof marcaSchema>;

export default function MarcaFormModal({ open, onOpenChange, onSave, editing }: MarcaFormModalProps) {
    const { items: campanhas } = useCampanhas();

    const form = useForm<MarcaFormData>({
        resolver: zodResolver(marcaSchema),
        defaultValues: {
            nome: "",
            descricao: "",
            descricao_produto: "",
            campanha_id: null,
        },
    });

    useEffect(() => {
        if (editing) {
            form.reset({
                nome: editing.nome,
                descricao: editing.descricao || "",
                descricao_produto: editing.descricao_produto || "",
                campanha_id: editing.campanha_id || null,
            });
        } else {
            form.reset({
                nome: "",
                descricao: "",
                descricao_produto: "",
                campanha_id: null,
            });
        }
    }, [editing, open, form]);

    const handleSubmit = async (values: MarcaFormData) => {
        await onSave({
            nome: values.nome,
            descricao: values.descricao || undefined,
            descricao_produto: values.descricao_produto || undefined,
            campanha_id: values.campanha_id || null,
        });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Tag className="h-5 w-5" />
                        {editing ? "Editar Marca" : "Nova Marca"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                        {/* Informações Básicas */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Tag className="h-4 w-4" /> Informações da Marca
                            </h3>

                            <FormField name="nome" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Marca *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: Nike, Apple, Coca-Cola..." className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField name="descricao" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição da Marca</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Textarea
                                                placeholder="Descreva o que é a marca, seus valores, missão..."
                                                className="pl-9 min-h-[80px]"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField name="descricao_produto" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição do Produto/Serviço</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Textarea
                                                placeholder="Descreva os produtos ou serviços oferecidos pela marca..."
                                                className="pl-9 min-h-[80px]"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Vínculo com Campanha */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Megaphone className="h-4 w-4" /> Campanha Vinculada
                            </h3>

                            <FormField name="campanha_id" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selecione uma Campanha (Opcional)</FormLabel>
                                    <Select
                                        value={field.value || undefined}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger aria-label="Selecionar campanha">
                                                <SelectValue placeholder="Nenhuma campanha selecionada" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="null">Nenhuma campanha</SelectItem>
                                            {campanhas.map(c => (
                                                <SelectItem key={c.id} value={c.id!}>
                                                    {c.titulo}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Vincule esta marca a uma campanha de marketing específica
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {editing ? "Salvar Alterações" : "Criar Marca"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
