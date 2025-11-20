import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Video, Calendar, Link, FileText, TrendingUp, Edit } from "lucide-react";
import { ConteudoPlatform, ConteudoStatus, ConteudoTipo, ConteudoItem } from "@/hooks/useConteudo";

interface ConteudoFormModalProps {
    onSave: (item: {
        titulo: string;
        tipo: ConteudoTipo;
        plataforma: ConteudoPlatform;
        status: ConteudoStatus;
        data_agendamento?: string;
        descricao?: string;
        link?: string;
    }) => Promise<void>;
    itemToEdit?: ConteudoItem | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const conteudoSchema = z.object({
    titulo: z.string().min(1, "Título é obrigatório"),
    tipo: z.enum(["POST", "STORY", "REEL", "VIDEO", "ARTIGO", "EMAIL"]),
    plataforma: z.enum(["INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "LINKEDIN", "EMAIL", "BLOG", "CURSO_NOXUS_MVP"]),
    status: z.enum(["IDEIA", "EM_PRODUCAO", "REVISAO", "AGENDADO", "PUBLICADO", "ARQUIVADO"]),
    data_agendamento: z.string().optional(),
    descricao: z.string().optional(),
    link: z.string().optional(),
});

type ConteudoFormData = z.infer<typeof conteudoSchema>;

export default function ConteudoFormModal({ onSave, itemToEdit, open: controlledOpen, onOpenChange }: ConteudoFormModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const form = useForm<ConteudoFormData>({
        resolver: zodResolver(conteudoSchema),
        defaultValues: {
            titulo: "",
            tipo: "POST",
            plataforma: "INSTAGRAM",
            status: "IDEIA",
            data_agendamento: "",
            descricao: "",
            link: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (itemToEdit) {
                form.reset({
                    titulo: itemToEdit.titulo,
                    tipo: itemToEdit.tipo,
                    plataforma: itemToEdit.plataforma,
                    status: itemToEdit.status,
                    data_agendamento: itemToEdit.data_agendamento || "",
                    descricao: itemToEdit.descricao || "",
                    link: itemToEdit.link || "",
                });
            } else {
                form.reset({
                    titulo: "",
                    tipo: "POST",
                    plataforma: "INSTAGRAM",
                    status: "IDEIA",
                    data_agendamento: "",
                    descricao: "",
                    link: "",
                });
            }
        }
    }, [open, itemToEdit, form]);

    const handleSubmit = async (values: ConteudoFormData) => {
        setLoading(true);
        try {
            await onSave({
                titulo: values.titulo,
                tipo: values.tipo,
                plataforma: values.plataforma,
                status: values.status,
                data_agendamento: values.data_agendamento ? new Date(values.data_agendamento).toISOString() : undefined,
                descricao: values.descricao,
                link: values.link
            });
            setOpen(false);
            form.reset();
        } catch (error) {
            // Erro tratado no hook
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Conteúdo
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {itemToEdit ? <Edit className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                        {itemToEdit ? "Editar Conteúdo" : "Planejar Conteúdo"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                        {/* Grupo: Informações Básicas */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Informações Básicas
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="tipo" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="POST">Post</SelectItem>
                                                <SelectItem value="STORY">Story</SelectItem>
                                                <SelectItem value="REEL">Reel</SelectItem>
                                                <SelectItem value="VIDEO">Vídeo</SelectItem>
                                                <SelectItem value="ARTIGO">Artigo</SelectItem>
                                                <SelectItem value="EMAIL">E-mail</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="plataforma" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plataforma</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                                                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                                                <SelectItem value="YOUTUBE">YouTube</SelectItem>
                                                <SelectItem value="TIKTOK">TikTok</SelectItem>
                                                <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                                                <SelectItem value="BLOG">Blog</SelectItem>
                                                <SelectItem value="EMAIL">E-mail</SelectItem>
                                                <SelectItem value="CURSO_NOXUS_MVP">Curso Noxus MVP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField name="titulo" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título / Tema</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Video className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: Reels sobre Dicas de Tatuagem" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Grupo: Agendamento e Status */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Agendamento e Status
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="status" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status Inicial</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="IDEIA">Ideia</SelectItem>
                                                <SelectItem value="EM_PRODUCAO">Em Produção</SelectItem>
                                                <SelectItem value="REVISAO">Revisão</SelectItem>
                                                <SelectItem value="AGENDADO">Agendado</SelectItem>
                                                <SelectItem value="PUBLICADO">Publicado</SelectItem>
                                                <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="data_agendamento" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Prevista</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="datetime-local" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField name="link" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Link (Opcional)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Link className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="https://..." className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Grupo: Detalhes */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Detalhes
                            </h3>
                            <FormField name="descricao" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição / Roteiro</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Textarea placeholder="Detalhes do conteúdo..." className="pl-9 min-h-[100px]" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
