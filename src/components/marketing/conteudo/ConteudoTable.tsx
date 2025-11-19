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
import { Trash2, Edit2, ExternalLink } from "lucide-react";
import { ConteudoItem, ConteudoStatus } from "@/hooks/useConteudo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConteudoTableProps {
    items: ConteudoItem[];
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ConteudoStatus) => void;
}

const statusColors: Record<ConteudoStatus, string> = {
    ideia: "bg-gray-500",
    roteiro: "bg-blue-500",
    gravacao: "bg-yellow-500",
    edicao: "bg-purple-500",
    postado: "bg-green-500",
};

const statusLabels: Record<ConteudoStatus, string> = {
    ideia: "Ideia",
    roteiro: "Roteiro",
    gravacao: "Gravação",
    edicao: "Edição",
    postado: "Postado",
};

export default function ConteudoTable({ items, onDelete, onStatusChange }: ConteudoTableProps) {
    if (items.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Nenhum conteúdo encontrado.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Prevista</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{item.title}</span>
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                            Ver link <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{item.platform}</TableCell>
                            <TableCell>
                                <Badge className={`${statusColors[item.status]} hover:${statusColors[item.status]}`}>
                                    {statusLabels[item.status]}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {item.scheduled_date
                                    ? format(new Date(item.scheduled_date), "dd/MM/yyyy", { locale: ptBR })
                                    : "-"
                                }
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {/* Simplificação: Botão para avançar status (exemplo simples) */}
                                    {item.status !== 'postado' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const nextStatusMap: Record<ConteudoStatus, ConteudoStatus> = {
                                                    ideia: 'roteiro',
                                                    roteiro: 'gravacao',
                                                    gravacao: 'edicao',
                                                    edicao: 'postado',
                                                    postado: 'postado'
                                                };
                                                onStatusChange(item.id, nextStatusMap[item.status]);
                                            }}
                                        >
                                            Avançar
                                        </Button>
                                    )}
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
