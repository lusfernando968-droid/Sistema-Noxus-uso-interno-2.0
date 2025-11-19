import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Megaphone, DollarSign, Calendar, TrendingUp, Info } from "lucide-react";
import { AnuncioPlatform, AnuncioStatus } from "@/hooks/useAnuncios";

interface AnuncioFormModalProps {
    onSave: (item: {
        campaign_name: string;
        platform: AnuncioPlatform;
        status: AnuncioStatus;
        budget: number;
        start_date?: string;
        end_date?: string;
    }) => Promise<void>;
}

const anuncioSchema = z.object({
    campaign_name: z.string().min(1, "Nome da campanha é obrigatório"),
    platform: z.enum(["meta", "google", "tiktok"]),
    status: z.enum(["ativo", "pausado", "concluido"]),
    budget: z.number().min(0, "Orçamento deve ser maior ou igual a zero"),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
});

type AnuncioFormData = z.infer<typeof anuncioSchema>;

// Função para formatar valor como moeda brasileira
const formatCurrency = (value: number | null | undefined): string => {
    if (!value && value !== 0) return "";
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função para converter string formatada em número
const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
};

export default function AnuncioFormModal({ onSave }: AnuncioFormModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [budgetDisplay, setBudgetDisplay] = useState<string>("");

    const form = useForm<AnuncioFormData>({
        resolver: zodResolver(anuncioSchema),
        defaultValues: {
            campaign_name: "",
            platform: "meta",
            status: "ativo",
            budget: 0,
            start_date: "",
            end_date: "",
        },
    });

    useEffect(() => {
        if (!open) {
            form.reset();
            setBudgetDisplay("");
        }
    }, [open, form]);

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^\d,]/g, '');
        setBudgetDisplay(value);
        const numericValue = parseCurrency(value);
        form.setValue("budget", numericValue);
    };

    const handleBudgetBlur = () => {
        const currentValue = form.watch("budget");
        setBudgetDisplay(formatCurrency(currentValue));
    };

    const handleSubmit = async (values: AnuncioFormData) => {
        setLoading(true);
        try {
            await onSave({
                campaign_name: values.campaign_name,
                platform: values.platform,
                status: values.status,
                budget: values.budget,
                start_date: values.start_date || undefined,
                end_date: values.end_date || undefined,
            });
            setOpen(false);
            form.reset();
            setBudgetDisplay("");
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
                    Novo Anúncio
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Megaphone className="h-5 w-5" />
                        Criar Anúncio
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                        {/* Grupo: Informações da Campanha */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4" /> Informações da Campanha
                            </h3>
                            <FormField name="campaign_name" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Campanha</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Megaphone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: Promoção de Verão" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

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
                                                <SelectItem value="meta">Meta (FB/IG)</SelectItem>
                                                <SelectItem value="google">Google Ads</SelectItem>
                                                <SelectItem value="tiktok">TikTok Ads</SelectItem>
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
                                                <SelectItem value="ativo">Ativo</SelectItem>
                                                <SelectItem value="pausado">Pausado</SelectItem>
                                                <SelectItem value="concluido">Concluído</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Grupo: Orçamento e Período */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Orçamento e Período
                            </h3>
                            <FormField name="budget" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Orçamento Total</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                value={budgetDisplay}
                                                onChange={handleBudgetChange}
                                                onBlur={handleBudgetBlur}
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="start_date" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Início</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="date" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="end_date" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Fim</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="date" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Salvando..." : "Criar Anúncio"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
