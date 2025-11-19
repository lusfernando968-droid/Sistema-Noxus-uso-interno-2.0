import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Instagram, Linkedin, FileText, Youtube } from "lucide-react";
import { ConteudoItem } from "@/hooks/useConteudo";

interface ConteudoStatsProps {
    items: ConteudoItem[];
}

export default function ConteudoStats({ items }: ConteudoStatsProps) {
    const totalIdeas = items.filter(i => i.status === 'ideia').length;
    const totalScheduled = items.filter(i => i.status === 'roteiro' || i.status === 'gravacao' || i.status === 'edicao').length;
    const totalPosted = items.filter(i => i.status === 'postado').length;

    // Contagem por plataforma (exemplo simples)
    const instagramCount = items.filter(i => i.platform === 'instagram').length;
    const youtubeCount = items.filter(i => i.platform === 'youtube').length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ideias</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalIdeas}</div>
                    <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Em Produção</CardTitle>
                    <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalScheduled}</div>
                    <p className="text-xs text-muted-foreground">Roteiro, Gravação ou Edição</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Postados</CardTitle>
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPosted}</div>
                    <p className="text-xs text-muted-foreground">Conteúdos publicados</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Youtube / Longos</CardTitle>
                    <Youtube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{youtubeCount}</div>
                    <p className="text-xs text-muted-foreground">Vídeos longos</p>
                </CardContent>
            </Card>
        </div>
    );
}
