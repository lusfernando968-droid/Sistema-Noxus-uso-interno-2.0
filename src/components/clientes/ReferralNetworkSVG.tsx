import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { useTouchGestures } from "@/hooks/useTouchGestures";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  EyeOff,
  Map as MapIcon,
  MousePointer,
  Download,
  Share2,
  BarChart3
} from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  indicado_por?: string;
  ltv?: number;
  created_at: string;
}

interface NetworkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: string[];
  level: number;
  ltv: number;
  isRoot: boolean;
  indicacoes_count: number;
}

interface ReferralNetworkSVGProps {
  clientes: Cliente[];
}

export function ReferralNetworkSVG({ clientes }: ReferralNetworkSVGProps) {
  const { colorTheme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Estados principais
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  
  // Estados de visualização
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  
  // Dimensões do SVG
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  // Cores do tema
  const themeColors = {
    default: "#8B5CF6",
    ocean: "#06B6D4", 
    sunset: "#F59E0B",
    forest: "#10B981",
    purple: "#8B5CF6",
    rose: "#F43F5E",
    black: "#6B7280"
  };

  const currentThemeColor = themeColors[colorTheme as keyof typeof themeColors] || themeColors.default;

  // Processa dados dos clientes em nodes
  const processedNodes = useMemo(() => {
    if (!clientes.length) return [];

    const nodeMap = new Map<string, NetworkNode>();
    const connections = new Map<string, string[]>();

    // Cria nodes básicos
    clientes.forEach((cliente) => {
      const indicacoes = clientes.filter(c => c.indicado_por === cliente.id);
      
      nodeMap.set(cliente.id, {
        id: cliente.id,
        name: cliente.nome,
        x: 0,
        y: 0,
        connections: indicacoes.map(i => i.id),
        level: 0,
        ltv: cliente.ltv || 0,
        isRoot: !cliente.indicado_por,
        indicacoes_count: indicacoes.length,
      });

      connections.set(cliente.id, indicacoes.map(i => i.id));
    });

    // Calcula níveis hierárquicos
    const calculateLevels = (nodeId: string, level: number, visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (node) {
        node.level = level;
        const children = connections.get(nodeId) || [];
        children.forEach(childId => calculateLevels(childId, level + 1, visited));
      }
    };

    // Encontra nós raiz e calcula níveis
    const rootNodes = Array.from(nodeMap.values()).filter(node => node.isRoot);
    rootNodes.forEach(root => calculateLevels(root.id, 0, new Set()));

    // Posiciona nodes em layout hierárquico
    const levelGroups = new Map<number, NetworkNode[]>();
    nodeMap.forEach(node => {
      const level = node.level;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    // Calcula posições
    levelGroups.forEach((nodesInLevel, level) => {
      const levelY = centerY + (level - 1) * 120;
      const spacing = Math.min(width / (nodesInLevel.length + 1), 150);
      const startX = centerX - ((nodesInLevel.length - 1) * spacing) / 2;

      nodesInLevel.forEach((node, index) => {
        node.x = startX + index * spacing;
        node.y = levelY;
      });
    });

    return Array.from(nodeMap.values());
  }, [clientes, centerX, centerY, width]);

  // Atualiza nodes quando processados
  useEffect(() => {
    setNodes(processedNodes);
  }, [processedNodes]);

  // Touch gestures para mobile
  useTouchGestures({
    onPinch: (scale, center) => {
      const newZoom = Math.max(0.1, Math.min(3, scale));
      setZoom(newZoom);
    },
    onPan: (delta) => {
      setPan(prev => ({
        x: prev.x + delta.x,
        y: prev.y + delta.y
      }));
    },
    onTap: (point) => {
      handleSVGClick(point);
    },
    onDoubleTap: () => {
      resetView();
    }
  });

  // Handlers
  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isMultiSelectMode) {
      setSelectedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });
    } else {
      setSelectedNode(nodeId);
      setSelectedNodes(new Set([nodeId]));
    }
  };

  const handleSVGClick = (point: { x: number; y: number }) => {
    if (!isMultiSelectMode) {
      setSelectedNode(null);
      setSelectedNodes(new Set());
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calcula tamanho do node baseado no LTV e nível
  const getNodeSize = (node: NetworkNode) => {
    const baseSize = 8;
    const ltvMultiplier = Math.min(node.ltv / 10000, 2);
    const levelMultiplier = Math.max(1 - node.level * 0.1, 0.5);
    return baseSize + ltvMultiplier * 4 + levelMultiplier * 2;
  };

  // Calcula cor do node
  const getNodeColor = (node: NetworkNode) => {
    const isSelected = selectedNode === node.id;
    const isMultiSelected = selectedNodes.has(node.id);
    const isHighlighted = highlightedNodes.has(node.id);

    if (isSelected || isMultiSelected || isHighlighted) {
      return currentThemeColor;
    }

    // Cor baseada no nível
    const opacity = Math.max(0.6 - node.level * 0.1, 0.3);
    return `${currentThemeColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  // Dados do node selecionado
  const selectedNodeData = selectedNode ? 
    clientes.find(c => c.id === selectedNode) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 h-[600px]">
      {/* Área principal da rede */}
      <div className="lg:col-span-5">
        <Card className="h-full rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Rede de Indicações
              </CardTitle>
              
              {/* Controles */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={resetView}
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant={showLabels ? "default" : "outline"}
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setShowLabels(!showLabels)}
                  title="Toggle Labels"
                >
                  {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant={isMultiSelectMode ? "default" : "outline"}
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                  title="Multi-select"
                >
                  <MousePointer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="h-[calc(100%-80px)] p-0">
            <div className="relative w-full h-full overflow-hidden rounded-b-xl">
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="bg-gradient-to-br from-background to-muted/20"
                onClick={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    const point = {
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    };
                    handleSVGClick(point);
                  }
                }}
              >
                {/* Definições de gradientes e filtros */}
                <defs>
                  <radialGradient id="nodeGradient" cx="0.3" cy="0.3">
                    <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                  
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Grupo principal com transformações */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Conexões */}
                  {nodes.map(node => 
                    node.connections.map(connectionId => {
                      const targetNode = nodes.find(n => n.id === connectionId);
                      if (!targetNode) return null;

                      return (
                        <line
                          key={`${node.id}-${connectionId}`}
                          x1={node.x}
                          y1={node.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={currentThemeColor}
                          strokeWidth="1"
                          strokeOpacity="0.3"
                          className="transition-all duration-300"
                        />
                      );
                    })
                  )}

                  {/* Nodes */}
                  {nodes.map(node => {
                    const size = getNodeSize(node);
                    const color = getNodeColor(node);
                    const isSelected = selectedNode === node.id || selectedNodes.has(node.id);

                    return (
                      <g key={node.id}>
                        {/* Glow effect para nodes selecionados */}
                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={size + 4}
                            fill={currentThemeColor}
                            fillOpacity="0.3"
                            filter="url(#glow)"
                          />
                        )}
                        
                        {/* Node principal */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={size}
                          fill={color}
                          stroke="white"
                          strokeWidth="2"
                          className="cursor-pointer transition-all duration-300 hover:scale-110"
                          onClick={(e) => handleNodeClick(node.id, e)}
                        />
                        
                        {/* Gradiente interno */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={size - 1}
                          fill="url(#nodeGradient)"
                          pointerEvents="none"
                        />

                        {/* Label */}
                        {showLabels && (
                          <text
                            x={node.x}
                            y={node.y + size + 16}
                            textAnchor="middle"
                            className="text-xs font-medium fill-foreground"
                            pointerEvents="none"
                          >
                            {node.name.split(' ')[0]}
                          </text>
                        )}

                        {/* Indicador de indicações */}
                        {node.indicacoes_count > 0 && (
                          <circle
                            cx={node.x + size - 2}
                            cy={node.y - size + 2}
                            r="6"
                            fill={currentThemeColor}
                            stroke="white"
                            strokeWidth="1"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Controles flutuantes */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl bg-background/80 backdrop-blur-sm"
                  onClick={() => setShowMinimap(!showMinimap)}
                  title="Toggle Minimap"
                >
                  <MapIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de informações */}
      <div className="lg:col-span-2 space-y-4">
        {/* Informações do node selecionado */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNodeData ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedNodeData.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedNodeData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LTV</p>
                  <p className="font-medium">R$ {(selectedNodeData.ltv || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indicações</p>
                  <p className="font-medium">
                    {nodes.find(n => n.id === selectedNodeData.id)?.indicacoes_count || 0}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecione um cliente para ver detalhes
              </p>
            )}

            {/* Multi-seleção */}
            {isMultiSelectMode && selectedNodes.size > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Seleção Múltipla</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{selectedNodes.size}</span> clientes selecionados
                  </p>
                  <p className="text-sm">
                    LTV Total: <span className="font-medium">
                      R$ {Array.from(selectedNodes)
                        .reduce((total, nodeId) => {
                          const cliente = clientes.find(c => c.id === nodeId);
                          return total + (cliente?.ltv || 0);
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Legenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-primary"></div>
              <span className="text-sm">Cliente Raiz</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary/60"></div>
              <span className="text-sm">1ª Geração</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary/40"></div>
              <span className="text-sm">2ª+ Gerações</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-white"></div>
              <span className="text-sm">Com Indicações</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}