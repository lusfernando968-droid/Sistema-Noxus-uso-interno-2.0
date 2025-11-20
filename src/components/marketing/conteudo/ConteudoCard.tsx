import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Image, FileText, Mail, Calendar } from "lucide-react";
import { ConteudoItem } from "@/hooks/useConteudo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConteudoCardProps {
    item: ConteudoItem;
    onClick?: () => void;
    compact?: boolean;
    draggable?: boolean;
    isDragging?: boolean;
}

export function ConteudoCard({
    item,
    onClick,
    compact = false,
    draggable = false,
    isDragging = false
}: ConteudoCardProps) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IDEIA':
                return {
                    bg: 'bg-yellow-500',
                    text: 'text-yellow-700 dark:text-yellow-300',
                    bgLight: 'bg-yellow-50 dark:bg-yellow-950/50',
                    border: 'border-yellow-200 dark:border-yellow-800'
                };
            case 'EM_PRODUCAO':
                return {
                    bg: 'bg-blue-500',
                    text: 'text-blue-700 dark:text-blue-300',
                    bgLight: 'bg-blue-50 dark:bg-blue-950/50',
                    border: 'border-blue-200 dark:border-blue-800'
                };
            case 'REVISAO':
                return {
                    bg: 'bg-purple-500',
                    text: 'text-purple-700 dark:text-purple-300',
                    bgLight: 'bg-purple-50 dark:bg-purple-950/50',
                    border: 'border-purple-200 dark:border-purple-800'
                };
            case 'AGENDADO':
                return {
                    bg: 'bg-orange-500',
                    text: 'text-orange-700 dark:text-orange-300',
                    bgLight: 'bg-orange-50 dark:bg-orange-950/50',
                    border: 'border-orange-200 dark:border-orange-800'
                };
            case 'PUBLICADO':
                return {
                    bg: 'bg-green-500',
                    text: 'text-green-700 dark:text-green-300',
                    bgLight: 'bg-green-50 dark:bg-green-950/50',
                    border: 'border-green-200 dark:border-green-800'
                };
            case 'ARQUIVADO':
                return {
                    bg: 'bg-gray-500',
                    text: 'text-gray-700 dark:text-gray-300',
                    bgLight: 'bg-gray-50 dark:bg-gray-950/50',
                    border: 'border-gray-200 dark:border-gray-800'
                };
            default:
                return {
                    bg: 'bg-gray-500',
                    text: 'text-gray-700 dark:text-gray-300',
                    bgLight: 'bg-gray-50 dark:bg-gray-950/50',
                    border: 'border-gray-200 dark:border-gray-800'
                };
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'VIDEO':
            case 'REEL': return <Video className="h-3 w-3" />;
            case 'EMAIL': return <Mail className="h-3 w-3" />;
            case 'ARTIGO': return <FileText className="h-3 w-3" />;
            default: return <Image className="h-3 w-3" />;
        }
    };

    const statusColors = getStatusColor(item.status);

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '';
        return format(new Date(dateStr), "HH:mm");
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'IDEIA': return 'Ideia';
            case 'EM_PRODUCAO': return 'Em Produção';
            case 'REVISAO': return 'Revisão';
            case 'AGENDADO': return 'Agendado';
            case 'PUBLICADO': return 'Publicado';
            case 'ARQUIVADO': return 'Arquivado';
            default: return status;
        }
    };

    if (compact) {
        return (
            <div
                className={`
          relative p-2 rounded-lg border-l-4 cursor-pointer
          transition-all duration-200 hover:shadow-sm
          ${statusColors.bgLight} ${statusColors.border}
          ${isDragging ? 'opacity-50 scale-95' : ''}
          ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
                style={{ borderLeftColor: statusColors.bg.replace('bg-', '') }}
                onClick={onClick}
            >
                {/* Conteúdo compacto */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                            {getIcon(item.tipo)}
                            <span className={`text-xs font-medium truncate ${statusColors.text}`}>
                                {item.titulo}
                            </span>
                        </div>
                        {item.data_agendamento && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatTime(item.data_agendamento)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card
            className={`
        cursor-pointer transition-all duration-200 hover:shadow-lg
        ${statusColors.border} ${statusColors.bgLight}
        ${isDragging ? 'opacity-50 scale-95 rotate-2' : ''}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
            onClick={onClick}
        >
            <CardContent className="p-4">
                {/* Header com status e horário */}
                <div className="flex items-center justify-between mb-3">
                    <Badge
                        variant="outline"
                        className={`${statusColors.text} ${statusColors.border} ${statusColors.bgLight}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${statusColors.bg} mr-2`} />
                        {getStatusLabel(item.status)}
                    </Badge>

                    {item.data_agendamento && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(item.data_agendamento), "dd/MM HH:mm", { locale: ptBR })}</span>
                        </div>
                    )}
                </div>

                {/* Informações principais */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {getIcon(item.tipo)}
                        <span className="font-medium text-foreground">{item.titulo}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {item.plataforma}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {item.tipo}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
