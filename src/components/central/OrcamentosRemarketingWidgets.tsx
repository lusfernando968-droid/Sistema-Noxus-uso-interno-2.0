import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrcamentosRemarketing } from "@/hooks/useOrcamentosRemarketing";

export function OrcamentosRemarketingWidgets() {
    const navigate = useNavigate();
    const { orcamentos5Dias, orcamentos30Dias, loading } = useOrcamentosRemarketing();

    return (
        <>
            {/* Follow-up: Orçamentos 5 Dias */}
            <Card className="rounded-2xl border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Remarketing (5 Dias)
                        <Badge variant="secondary" className="ml-auto">{orcamentos5Dias.length}</Badge>
                    </CardTitle>
                    <CardDescription>Orçamentos que precisam de acompanhamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
                    ) : orcamentos5Dias.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum orçamento para remarketing hoje.</p>
                    ) : (
                        <div className="space-y-3">
                            {orcamentos5Dias.map(o => (
                                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{o.nome}</span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{o.numero}</span>
                                            <span>•</span>
                                            <span className="capitalize">{o.plataforma_contato}</span>
                                            {o.valor_total && <><span>•</span><span>R$ {o.valor_total.toFixed(2)}</span></>}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" title="Ver orçamento" onClick={() => navigate('/orcamento')}>
                                        <ArrowRight className="w-4 h-4 text-emerald-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Follow-up: Orçamentos 30 Dias */}
            <Card className="rounded-2xl border-l-4 border-l-cyan-500 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-500" />
                        Feedback (30 Dias)
                        <Badge variant="secondary" className="ml-auto">{orcamentos30Dias.length}</Badge>
                    </CardTitle>
                    <CardDescription>Solicitar feedback de orçamentos não fechados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
                    ) : orcamentos30Dias.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum orçamento para feedback hoje.</p>
                    ) : (
                        <div className="space-y-3">
                            {orcamentos30Dias.map(o => (
                                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/10 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{o.nome}</span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{o.numero}</span>
                                            <span>•</span>
                                            <span className="capitalize">{o.plataforma_contato}</span>
                                            {o.valor_total && <><span>•</span><span>R$ {o.valor_total.toFixed(2)}</span></>}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" title="Ver orçamento" onClick={() => navigate('/orcamento')}>
                                        <ArrowRight className="w-4 h-4 text-cyan-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
