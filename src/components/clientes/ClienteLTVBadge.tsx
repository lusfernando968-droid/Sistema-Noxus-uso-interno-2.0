import { Badge } from "@/components/ui/badge";
import { getLTVColor, getLTVLabel } from "@/hooks/useClientes";
import { formatCurrency } from "@/utils/formatters";

interface ClienteLTVBadgeProps {
  ltv: number;
  maxLTV: number;
  showValue?: boolean;
  className?: string;
}

export function ClienteLTVBadge({ ltv, maxLTV, showValue = false, className = "" }: ClienteLTVBadgeProps) {
  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <Badge variant="outline" className={`rounded-full text-xs ${getLTVColor(ltv, maxLTV)}`}>
        {getLTVLabel(ltv)}
      </Badge>
      {showValue && (
        <span className="text-sm font-semibold text-success">{formatCurrency(ltv)}</span>
      )}
    </div>
  );
}

