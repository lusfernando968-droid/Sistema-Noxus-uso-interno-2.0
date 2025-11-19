import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, PenTool, Wallet, BookOpen, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Tattoo() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Nexus</CardTitle>
              <p className="text-sm text-muted-foreground">Área inicial personalizada para o estúdio</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Centralize aqui seus atalhos, métricas favoritas e informações rápidas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/noxus")}>
                <PenTool className="w-4 h-4" />
                Tattoo
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/carteira")}>
                <Wallet className="w-4 h-4" />
                Carteira
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/conhecimento")}>
                <BookOpen className="w-4 h-4" />
                Conhecimento
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/curso-mvp")}>
                <GraduationCap className="w-4 h-4" />
                curso MVP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
