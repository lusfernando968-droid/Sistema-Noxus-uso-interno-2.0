import { useState } from 'react';
import { ConteudoItem, ConteudoStatus } from '@/hooks/useConteudo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Trash2, Video, Image, FileText, Mail, MoreHorizontal, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConteudoKanbanProps {
    items: ConteudoItem[];
    onStatusChange: (id: string, status: ConteudoStatus) => void;
    onDelete: (id: string) => void;
    onEdit: (item: ConteudoItem) => void;
}

const COLUMNS: { id: ConteudoStatus; title: string; dotColor: string }[] = [
    { id: 'IDEIA', title: 'Ideias', dotColor: 'bg-yellow-500' },
    { id: 'EM_PRODUCAO', title: 'Em Produção', dotColor: 'bg-blue-500' },
    { id: 'REVISAO', title: 'Revisão', dotColor: 'bg-purple-500' },
    { id: 'AGENDADO', title: 'Agendado', dotColor: 'bg-orange-500' },
    { id: 'PUBLICADO', title: 'Publicado', dotColor: 'bg-green-500' },
    { id: 'ARQUIVADO', title: 'Arquivado', dotColor: 'bg-gray-500' },
];

const getIcon = (tipo: string) => {
    switch (tipo) {
        case 'VIDEO':
        case 'REEL': return <Video className="h-3 w-3" />;
        case 'EMAIL': return <Mail className="h-3 w-3" />;
        case 'ARTIGO': return <FileText className="h-3 w-3" />;
        default: return <Image className="h-3 w-3" />;
    }
};

export default function ConteudoKanban({ items, onStatusChange, onDelete, onEdit }: ConteudoKanbanProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: ConteudoStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) {
            onStatusChange(id, status);
        }
        setDraggedId(null);
    };

    const renderCard = (item: ConteudoItem) => (
        <Card
            key={item.id}
            className={`mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedId === item.id ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDoubleClick={() => onEdit(item)}
        >
            <CardContent className="p-3 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            {getIcon(item.tipo)}
                            <span className="font-medium text-sm line-clamp-2">{item.titulo}</span>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5 font-normal">
                        {item.plataforma}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 font-normal">
                        {item.tipo}
                    </Badge>
                </div>

                {item.data_agendamento && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.data_agendamento), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="flex gap-4 h-[calc(100vh-250px)] overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
                const colItems = items.filter((item) => item.status === col.id);
                return (
                    <div
                        key={col.id}
                        className="flex flex-col h-full min-w-[280px] w-[280px] bg-muted/30 rounded-xl border p-2"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <div className="p-3 mb-2 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                                <span className="font-medium text-sm text-foreground">{col.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-background rounded-full border">
                                {colItems.length}
                            </span>
                        </div>

                        <ScrollArea className="flex-1 -mr-2 pr-2">
                            <div className="min-h-[100px]">
                                {colItems.length === 0 ? (
                                    <div className="h-24 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                                        Arraste itens para cá
                                    </div>
                                ) : (
                                    colItems.map(renderCard)
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                );
            })}
        </div>
    );
}
