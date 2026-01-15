import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface ReportCardProps {
    title: string;
    value: number | string;
    prevValue?: number | string;
    type?: "currency" | "number" | "percentage";
    icon: any;
    description?: string;
}

export function ReportCard({ title, value, prevValue, type = "number", icon: Icon, description }: ReportCardProps) {
    const formatValue = (val: number | string) => {
        if (typeof val === "string") return val;
        if (type === "currency") return formatCurrency(val);
        if (type === "percentage") return `${val.toFixed(1)}%`;
        return val.toLocaleString();
    };

    const calculateGrowth = () => {
        if (typeof value !== "number" || typeof prevValue !== "number" || prevValue === 0) return null;
        return ((value - prevValue) / prevValue) * 100;
    };

    const growth = calculateGrowth();
    const isPositive = growth !== null && growth > 0;
    const isNegative = growth !== null && growth < 0;
    const isNeutral = growth === 0 || growth === null;

    return (
        <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {growth !== null && (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? "bg-emerald-500/10 text-emerald-600" :
                                isNegative ? "bg-rose-500/10 text-rose-600" :
                                    "bg-muted text-muted-foreground"
                            }`}>
                            {isPositive && <ArrowUpRight className="w-3 h-3" />}
                            {isNegative && <ArrowDownRight className="w-3 h-3" />}
                            {isNeutral && <Minus className="w-3 h-3" />}
                            <span>{Math.abs(growth).toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
                <div className="text-2xl font-bold tracking-tight">{formatValue(value)}</div>

                {description && (
                    <p className="text-xs text-muted-foreground mt-2">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}
