import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { BrandingAsset } from "@/hooks/useBranding";
import { toast } from "sonner";

interface BrandingGalleryProps {
    assets: BrandingAsset[];
    onDelete: (id: string) => void;
}

export default function BrandingGallery({ assets, onDelete }: BrandingGalleryProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência!");
    };

    if (assets.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                Nenhum ativo de marca cadastrado.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mt-6">
            {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base truncate" title={asset.title}>
                            {asset.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center justify-center h-32 bg-muted/20">
                        {asset.type === 'color' && (
                            <div
                                className="w-20 h-20 rounded-full shadow-sm border"
                                style={{ backgroundColor: asset.value }}
                            />
                        )}
                        {asset.type === 'logo' && asset.asset_url && (
                            <img
                                src={asset.asset_url}
                                alt={asset.title}
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                        {asset.type === 'font' && (
                            <div className="text-3xl" style={{ fontFamily: asset.value }}>
                                Aa
                            </div>
                        )}
                        {asset.type === 'manual' && (
                            <div className="text-center text-sm text-muted-foreground">
                                Documento PDF
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="p-2 bg-muted/50 flex justify-between items-center">
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {asset.value || asset.type}
                        </div>
                        <div className="flex gap-1">
                            {asset.value && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(asset.value!)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => onDelete(asset.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
