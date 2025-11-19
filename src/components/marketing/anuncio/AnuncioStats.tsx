import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, MousePointer, Users, TrendingUp } from "lucide-react";
import { AnuncioItem } from "@/hooks/useAnuncios";

interface AnuncioStatsProps {
    items: AnuncioItem[];
}

export default function AnuncioStats({ items }: AnuncioStatsProps) {
    const totalSpend = items.reduce((acc, item) => acc + (item.spend || 0), 0);
    const totalReach = items.reduce((acc, item) => acc + (item.reach || 0), 0);
    const totalClicks = items.reduce((acc, item) => acc + (item.clicks || 0), 0);

    // Cálculo simples de CPC (Custo por Clique)
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
                    <p className="text-xs text-muted-foreground">Investimento acumulado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alcance</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalReach.toLocaleString('pt-BR')}</div>
                    <p className="text-xs text-muted-foreground">Pessoas impactadas</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalClicks.toLocaleString('pt-BR')}</div>
                    <p className="text-xs text-muted-foreground">Interações diretas</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPC Médio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(avgCPC)}</div>
                    <p className="text-xs text-muted-foreground">Custo por clique</p>
                </CardContent>
            </Card>
        </div>
    );
}
