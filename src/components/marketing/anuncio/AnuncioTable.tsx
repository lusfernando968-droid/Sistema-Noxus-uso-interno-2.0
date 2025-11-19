import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pause, Play } from "lucide-react";
import { AnuncioItem, AnuncioStatus } from "@/hooks/useAnuncios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnuncioTableProps {
    items: AnuncioItem[];
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: AnuncioStatus) => void;
}

const statusColors: Record<AnuncioStatus, string> = {
    ativo: "bg-green-500",
    pausado: "bg-yellow-500",
    concluido: "bg-gray-500",
};

export default function AnuncioTable({ items, onDelete, onStatusChange }: AnuncioTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (items.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Nenhum anúncio encontrado.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Orçamento</TableHead>
                        <TableHead>Gasto</TableHead>
                        <TableHead>Resultados</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{item.campaign_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {item.start_date ? format(new Date(item.start_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{item.platform}</TableCell>
                            <TableCell>
                                <Badge className={`${statusColors[item.status]} hover:${statusColors[item.status]}`}>
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(item.budget)}</TableCell>
                            <TableCell>{formatCurrency(item.spend)}</TableCell>
                            <TableCell>
                                <div className="text-xs">
                                    <div>Alcance: {item.reach.toLocaleString('pt-BR')}</div>
                                    <div>Cliques: {item.clicks.toLocaleString('pt-BR')}</div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {item.status === 'ativo' ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Pausar"
                                            onClick={() => onStatusChange(item.id, 'pausado')}
                                        >
                                            <Pause className="h-4 w-4" />
                                        </Button>
                                    ) : item.status === 'pausado' ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Ativar"
                                            onClick={() => onStatusChange(item.id, 'ativo')}
                                        >
                                            <Play className="h-4 w-4" />
                                        </Button>
                                    ) : null}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => onDelete(item.id)}
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
