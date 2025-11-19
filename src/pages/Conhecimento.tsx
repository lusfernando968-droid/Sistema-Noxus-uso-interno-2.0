import { BookOpen, Search, Filter, Plus, Clock, TrendingUp, Award, Users } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ArtigoConhecimento {
  id: string;
  titulo: string;
  categoria: string;
  autor: string;
  data: string;
  tempoLeitura: number;
  visualizacoes: number;
  curtidas: number;
  tags: string[];
  resumo: string;
}

const mockArtigos: ArtigoConhecimento[] = [
  {
    id: "1",
    titulo: "Técnicas Avançadas de Sombreamento",
    categoria: "Técnica",
    autor: "Carlos Silva",
    data: "2024-01-15",
    tempoLeitura: 8,
    visualizacoes: 245,
    curtidas: 32,
    tags: ["sombreamento", "técnica", "avançado"],
    resumo: "Aprenda técnicas profissionais de sombreamento que vão elevar seu trabalho para o próximo nível."
  },
  {
    id: "2",
    titulo: "Cuidados com a Pele Pós-Tatuagem",
    categoria: "Pós-Tratamento",
    autor: "Ana Santos",
    data: "2024-01-10",
    tempoLeitura: 5,
    visualizacoes: 189,
    curtidas: 28,
    tags: ["pós-tratamento", "cuidados", "pele"],
    resumo: "Guia completo sobre os melhores cuidados para garantir uma cicatrização perfeita."
  },
  {
    id: "3",
    titulo: "Escolhendo as Máquinas Certas",
    categoria: "Equipamentos",
    autor: "Roberto Lima",
    data: "2024-01-08",
    tempoLeitura: 6,
    visualizacoes: 156,
    curtidas: 22,
    tags: ["máquinas", "equipamentos", "dicas"],
    resumo: "Como escolher as melhores máquinas de tatuagem para cada estilo de trabalho."
  },
  {
    id: "4",
    titulo: "Colorimetria para Tatuadores",
    categoria: "Teoria",
    autor: "Mariana Costa",
    data: "2024-01-05",
    tempoLeitura: 12,
    visualizacoes: 298,
    curtidas: 45,
    tags: ["cores", "teoria", "colorimetria"],
    resumo: "Entenda a teoria das cores e como aplicá-la nas suas tatuagens."
  }
];

const categorias = ["Todas", "Técnica", "Pós-Tratamento", "Equipamentos", "Teoria", "Design", "Negócios"];

function Conhecimento() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");
  const [artigos, setArtigos] = useState<ArtigoConhecimento[]>(mockArtigos);

  const artigosFiltrados = artigos.filter(artigo => {
    const matchSearch = artigo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       artigo.resumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       artigo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCategoria = categoriaSelecionada === "Todas" || artigo.categoria === categoriaSelecionada;
    
    return matchSearch && matchCategoria;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Centro de Conhecimento
          </h1>
          <p className="text-muted-foreground mt-1">
            Artigos, tutoriais e recursos para aprimorar suas habilidades
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Artigo
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artigos, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categorias.map(categoria => (
            <Badge
              key={categoria}
              variant={categoriaSelecionada === categoria ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoriaSelecionada(categoria)}
            >
              {categoria}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="artigos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="artigos" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Artigos
          </TabsTrigger>
          <TabsTrigger value="populares" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Mais Populares
          </TabsTrigger>
          <TabsTrigger value="comunidade" className="gap-2">
            <Users className="w-4 h-4" />
            Comunidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="artigos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {artigosFiltrados.map(artigo => (
              <Card key={artigo.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{artigo.categoria}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {artigo.tempoLeitura}min
                    </div>
                  </div>
                  <CardTitle className="text-lg">{artigo.titulo}</CardTitle>
                  <CardDescription>{artigo.resumo}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Por {artigo.autor}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {artigo.visualizacoes}
                      </span>
                      <span className="flex items-center gap-1">
                        {artigo.curtidas}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {artigo.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="populares" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {artigosFiltrados
              .sort((a, b) => b.visualizacoes - a.visualizacoes)
              .slice(0, 6)
              .map(artigo => (
                <Card key={artigo.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{artigo.categoria}</Badge>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        Popular
                      </div>
                    </div>
                    <CardTitle className="text-lg">{artigo.titulo}</CardTitle>
                    <CardDescription>{artigo.resumo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Por {artigo.autor}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{artigo.visualizacoes} visualizações</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="comunidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Comunidade de Tatuadores
              </CardTitle>
              <CardDescription>
                Conecte-se com outros profissionais, compartilhe experiências e aprenda juntos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Fórum de Discussão</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Participe de discussões sobre técnicas, equipamentos e tendências do mercado.
                  </p>
                  <Button size="sm">Acessar Fórum</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Grupos de Estudo</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Junte-se a grupos focados em aprimoramento específico de técnicas.
                  </p>
                  <Button size="sm" variant="outline">Explorar Grupos</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Mentoria</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Encontre mentores experientes ou ofereça mentoria para iniciantes.
                  </p>
                  <Button size="sm" variant="outline">Saber Mais</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Conhecimento;