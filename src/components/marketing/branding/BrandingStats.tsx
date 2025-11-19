import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Type, Image, FileText } from "lucide-react";
import { BrandingAsset } from "@/hooks/useBranding";

interface BrandingStatsProps {
    assets: BrandingAsset[];
}

export default function BrandingStats({ assets }: BrandingStatsProps) {
    const totalLogos = assets.filter(a => a.type === 'logo').length;
    const totalColors = assets.filter(a => a.type === 'color').length;
    const totalFonts = assets.filter(a => a.type === 'font').length;
    const totalManuals = assets.filter(a => a.type === 'manual').length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Logos</CardTitle>
                    <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalLogos}</div>
                    <p className="text-xs text-muted-foreground">Variações de marca</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cores</CardTitle>
                    <Palette className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalColors}</div>
                    <p className="text-xs text-muted-foreground">Paleta oficial</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tipografia</CardTitle>
                    <Type className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalFonts}</div>
                    <p className="text-xs text-muted-foreground">Fontes cadastradas</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Manuais</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalManuals}</div>
                    <p className="text-xs text-muted-foreground">Guias de uso</p>
                </CardContent>
            </Card>
        </div>
    );
}
