import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAnaliseCusto } from "@/hooks/useAnaliseCusto";
import { FlaskConical } from "lucide-react";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

export default function AnaliseUsoDialog({ open, onOpenChange, onConfirm }: Props) {
    const { analises, registrarUso } = useAnaliseCusto();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Filter only active analysis
    const ativos = analises.filter(a => a.status === 'ativo');

    // If no active analysis, we shouldn't even show this dialog really, 
    // but if it opens, we handle it.

    const handleToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleConfirm = async () => {
        if (selectedIds.length > 0) {
            await registrarUso(selectedIds);
        }
        onConfirm();
    };

    if (ativos.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        Análise de Bancada
                    </DialogTitle>
                    <DialogDescription>
                        Você utilizou algum destes materiais que estão em análise nesta sessão?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    {ativos.map(item => (
                        <div key={item.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/50 transition-colors">
                            <Checkbox
                                id={item.id}
                                checked={selectedIds.includes(item.id)}
                                onCheckedChange={() => handleToggle(item.id)}
                            />
                            <label
                                htmlFor={item.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                                {item.nome_produto}
                            </label>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onConfirm()}>
                        Não usei nenhum
                    </Button>
                    <Button onClick={handleConfirm}>
                        Confirmar Uso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
