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
import { Trash2, ExternalLink, Edit } from "lucide-react";
import { ConteudoItem, ConteudoStatus } from "@/hooks/useConteudo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConteudoTableProps {
    items: ConteudoItem[];
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ConteudoStatus) => void;
    onEdit: (item: ConteudoItem) => void;
}

const statusColors: Record<ConteudoStatus, string> = {
    IDEIA: "bg-gray-500",
    EM_PRODUCAO: "bg-blue-500",
    REVISAO: "bg-yellow-500",
    AGENDADO: "bg-purple-500",
    PUBLICADO: "bg-green-500",
    ARQUIVADO: "bg-red-500",
};

const statusLabels: Record<ConteudoStatus, string> = {
    IDEIA: "Ideia",
    EM_PRODUCAO: "Em Produção",
    REVISAO: "Revisão",
    AGENDADO: "Agendado",
    PUBLICADO: "Publicado",
    ARQUIVADO: "Arquivado",
};

export default function ConteudoTable({ items, onDelete, onStatusChange, onEdit }: ConteudoTableProps) {
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
                                    <span>{item.titulo}</span>
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                            Ver link <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{item.plataforma.toLowerCase()}</TableCell>
                            <TableCell>
                                <Badge className={`${statusColors[item.status]} hover:${statusColors[item.status]}`}>
                                    {statusLabels[item.status]}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {item.data_agendamento
                                    ? format(new Date(item.data_agendamento), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                    : "-"
                                }
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {/* Simplificação: Botão para avançar status (exemplo simples) */}
                                    {item.status !== 'PUBLICADO' && item.status !== 'ARQUIVADO' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const nextStatusMap: Record<ConteudoStatus, ConteudoStatus> = {
                                                    IDEIA: 'EM_PRODUCAO',
                                                    EM_PRODUCAO: 'REVISAO',
                                                    REVISAO: 'AGENDADO',
                                                    AGENDADO: 'PUBLICADO',
                                                    PUBLICADO: 'PUBLICADO',
                                                    ARQUIVADO: 'ARQUIVADO'
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
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => onEdit(item)}
                                        title="Editar"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => onDelete(item.id)}
                                        title="Excluir"
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
