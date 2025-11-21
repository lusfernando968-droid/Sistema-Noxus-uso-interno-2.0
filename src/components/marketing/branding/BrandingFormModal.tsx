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
import { Plus, Palette, Image, Type, FileText, Info } from "lucide-react";
import { BrandingAssetType } from "@/hooks/useBranding";

interface BrandingFormModalProps {
    onSave: (asset: { title: string; type: BrandingAssetType; value?: string; asset_url?: string; description?: string }) => Promise<void>;
    onUpload: (file: File) => Promise<string>;
}

const brandingSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    type: z.enum(["color", "logo", "font", "manual"]),
    value: z.string().optional(),
    description: z.string().optional(),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

export default function BrandingFormModal({ onSave, onUpload }: BrandingFormModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const form = useForm<BrandingFormData>({
        resolver: zodResolver(brandingSchema),
        defaultValues: {
            title: "",
            type: "color",
            value: "",
            description: "",
        },
    });

    const watchType = form.watch("type");

    useEffect(() => {
        if (!open) {
            form.reset();
            setSelectedFile(null);
        }
    }, [open, form]);

    const handleSubmit = async (values: BrandingFormData) => {
        setLoading(true);
        try {
            let assetUrl = values.type === 'logo' || values.type === 'manual' ? values.value : undefined;

            if (selectedFile) {
                assetUrl = await onUpload(selectedFile);
            }

            await onSave({
                title: values.title,
                type: values.type,
                value: values.type === 'color' || values.type === 'font' ? values.value : undefined,
                asset_url: assetUrl,
                description: values.description
            });
            setOpen(false);
            form.reset();
            setSelectedFile(null);
        } catch (error) {
            // Erro já tratado no hook
        } finally {
            setLoading(false);
        }
    };

    const getValueLabel = () => {
        switch (watchType) {
            case 'color': return 'Código da Cor (HEX/RGB)';
            case 'font': return 'Nome da Família da Fonte';
            default: return 'URL do Arquivo';
        }
    };

    const getValuePlaceholder = () => {
        switch (watchType) {
            case 'color': return '#000000';
            case 'font': return 'Inter, Roboto, etc.';
            default: return 'https://...';
        }
    };

    const getValueIcon = () => {
        switch (watchType) {
            case 'color': return Palette;
            case 'font': return Type;
            default: return Image;
        }
    };

    const ValueIcon = getValueIcon();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Palette className="h-5 w-5" />
                        Adicionar Asset de Marca
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                        {/* Grupo: Informações do Asset */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4" /> Informações do Asset
                            </h3>
                            <FormField name="type" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="color">Cor</SelectItem>
                                            <SelectItem value="logo">Logo (URL)</SelectItem>
                                            <SelectItem value="font">Fonte</SelectItem>
                                            <SelectItem value="manual">Manual (URL)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField name="title" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: Cor Primária, Logo Horizontal..." className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Grupo: Detalhes */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <ValueIcon className="h-4 w-4" /> Detalhes
                            </h3>
                            <FormField name="value" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{getValueLabel()}</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            {(watchType === 'logo' || watchType === 'manual') && (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept={watchType === 'logo' ? "image/*" : ".pdf,.doc,.docx"}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) setSelectedFile(file);
                                                        }}
                                                        className="cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                            <div className="relative">
                                                <ValueIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={getValuePlaceholder()}
                                                    className="pl-9"
                                                    {...field}
                                                    disabled={!!selectedFile}
                                                    value={selectedFile ? (selectedFile.name) : field.value}
                                                />
                                            </div>
                                            {selectedFile && (
                                                <p className="text-xs text-muted-foreground">
                                                    Arquivo selecionado: {selectedFile.name} (O URL será gerado após salvar)
                                                </p>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField name="description" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição (Opcional)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Textarea placeholder="Detalhes adicionais..." className="pl-9 min-h-[80px]" {...field} />
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
