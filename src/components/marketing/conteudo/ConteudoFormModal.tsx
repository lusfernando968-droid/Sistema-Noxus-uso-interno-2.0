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
import { Plus, Video, Calendar, Link, FileText, TrendingUp } from "lucide-react";
import { ConteudoPlatform, ConteudoStatus } from "@/hooks/useConteudo";

interface ConteudoFormModalProps {
    onSave: (item: {
        title: string;
        platform: ConteudoPlatform;
        status: ConteudoStatus;
        scheduled_date?: string;
        description?: string;
        link?: string;
    }) => Promise<void>;
}

const conteudoSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    platform: z.enum(["instagram", "youtube", "tiktok", "linkedin", "blog"]),
    status: z.enum(["ideia", "roteiro", "gravacao", "edicao", "postado"]),
    scheduled_date: z.string().optional(),
    description: z.string().optional(),
    link: z.string().optional(),
});

type ConteudoFormData = z.infer<typeof conteudoSchema>;

export default function ConteudoFormModal({ onSave }: ConteudoFormModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<ConteudoFormData>({
        resolver: zodResolver(conteudoSchema),
        defaultValues: {
            title: "",
            platform: "instagram",
            status: "ideia",
            scheduled_date: "",
            description: "",
            link: "",
        },
    });

    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    const handleSubmit = async (values: ConteudoFormData) => {
        setLoading(true);
        try {
            await onSave({
                title: values.title,
                platform: values.platform,
                status: values.status,
                scheduled_date: values.scheduled_date || undefined,
                description: values.description,
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
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Conteúdo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Video className="h-5 w-5" />
                        Planejar Conteúdo
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
                                <FormField name="platform" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plataforma</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="youtube">YouTube</SelectItem>
                                                <SelectItem value="tiktok">TikTok</SelectItem>
                                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                                <SelectItem value="blog">Blog</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
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
                                                <SelectItem value="ideia">Ideia</SelectItem>
                                                <SelectItem value="roteiro">Roteiro</SelectItem>
                                                <SelectItem value="gravacao">Gravação</SelectItem>
                                                <SelectItem value="edicao">Edição</SelectItem>
                                                <SelectItem value="postado">Postado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField name="title" control={form.control} render={({ field }) => (
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

                        {/* Grupo: Agendamento */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Agendamento
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="scheduled_date" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Prevista</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="date" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
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
                        </div>

                        {/* Grupo: Detalhes */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Detalhes
                            </h3>
                            <FormField name="description" control={form.control} render={({ field }) => (
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
