import { Badge } from "@/components/ui/badge";

interface ClienteStatusBadgeProps {
    status: 'lead' | 'cliente' | 'desativado' | string;
}

export function ClienteStatusBadge({ status }: ClienteStatusBadgeProps) {
    const normalizedStatus = (status || 'lead').toLowerCase();

    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "";
    let label = status;

    switch (normalizedStatus) {
        case 'cliente':
        case 'efetivado': // Retrocompatibilidade visual
            variant = "default"; // Usually black/primary
            className = "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent";
            label = "Cliente";
            break;
        case 'lead':
            variant = "secondary"; // Usually gray/secondary
            className = "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200";
            label = "Lead";
            break;
        case 'desativado':
            variant = "destructive";
            className = "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200";
            label = "Desativado";
            break;
        default:
            variant = "outline";
            className = "text-muted-foreground";
            label = status;
    }

    return (
        <Badge variant={variant} className={`font-medium ${className}`}>
            {label}
        </Badge>
    );
}
