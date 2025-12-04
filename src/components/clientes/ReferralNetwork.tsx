import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Target,
  Download,
  GitCompare,
  Info,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Thermometer,
  Clock,
  Brain,
  PieChart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  indicado_por?: string;
  ltv?: number;
  created_at: string;
  instagram?: string;
  cidade?: string;
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

interface ReferralNetworkProps {
  clientes: Cliente[];
}

export function ReferralNetwork({ clientes }: ReferralNetworkProps) {
  // Offset global para posicionar os nós em relação à linha de geração
  const NODE_LINE_OFFSET = 0; // 0 = exatamente sobre a linha; positivos = acima; negativos = abaixo
  const { colorTheme, theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [filterTerm, setFilterTerm] = useState("");
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'circular'>('hierarchical');

  // Estados para filtros avançados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [ltvRange, setLtvRange] = useState<[number, number]>([0, 10000]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [animationSpeed, setAnimationSpeed] = useState(300);

  // Estados para animações
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [previousNodes, setPreviousNodes] = useState<NetworkNode[]>([]);

  // Minimap removido

  // Estados para interatividade avançada
  // Removido: seleção múltipla
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("none"); // Comparação temporal
  const [showExportMenu, setShowExportMenu] = useState(false); // Menu de exportação

  // Estados para analytics visuais
  const [showAnalytics, setShowAnalytics] = useState(false); // Painel de analytics
  const [analyticsMode, setAnalyticsMode] = useState<'metrics' | 'heatmap' | 'temporal' | 'predictions' | 'roi'>('metrics');
  const [heatmapData, setHeatmapData] = useState<Map<string, number>>(new Map()); // Dados do heatmap
  const [temporalData, setTemporalData] = useState<Array<{ date: string, count: number, ltv: number }>>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    totalLTV: 0,
    avgIndicationsPerNode: 0,
    networkGrowthRate: 0,
    topPerformers: [] as Array<{ id: string; name: string; indicacoes_count: number }>
  });

  // Função para obter cores do tema atual
  const getThemeColors = () => {
    const themeColorMap = {
      default: { r: 139, g: 92, b: 246 }, // Roxo padrão
      ocean: { r: 6, g: 182, b: 212 }, // Ciano
      sunset: { r: 251, g: 146, b: 60 }, // Laranja
      forest: { r: 34, g: 197, b: 94 }, // Verde
      purple: { r: 168, g: 85, b: 247 }, // Violeta
      rose: { r: 244, g: 63, b: 94 }, // Rosa
      black: { r: 107, g: 114, b: 128 }, // Cinza
    };

    return themeColorMap[colorTheme] || themeColorMap.default;
  };

  // Função auxiliar para converter hex para RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Função auxiliar para converter RGB string para objeto RGB
  const rgbStringToRgb = (rgbString: string) => {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return match ? {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    } : null;
  };

  // Conversão HSL -> RGB para usar variáveis CSS do tema (ex.: --background)
  const hslToRgb = (h: number, sPercent: number, lPercent: number) => {
    const s = sPercent / 100;
    const l = lPercent / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (hp >= 0 && hp < 1) { r1 = c; g1 = x; b1 = 0; }
    else if (hp >= 1 && hp < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (hp >= 2 && hp < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (hp >= 3 && hp < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (hp >= 4 && hp < 5) { r1 = x; g1 = 0; b1 = c; }
    else if (hp >= 5 && hp < 6) { r1 = c; g1 = 0; b1 = x; }
    const m = l - c / 2;
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  };

  // Obtém a cor de fundo atual (dark/light) a partir das variáveis CSS
  const getBackgroundRgb = () => {
    try {
      const root = document.documentElement;
      const raw = getComputedStyle(root).getPropertyValue('--background').trim();
      if (!raw) return { r: 8, g: 12, b: 24 }; // fallback para cor antiga
      const parts = raw.split(/\s+/);
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1].replace('%', ''));
      const l = parseFloat(parts[2].replace('%', ''));
      return hslToRgb(h, s, l);
    } catch {
      return { r: 8, g: 12, b: 24 };
    }
  };

  // Cor de texto (foreground) do tema atual
  const getForegroundRgb = () => {
    try {
      const root = document.documentElement;
      const raw = getComputedStyle(root).getPropertyValue('--foreground').trim();
      if (!raw) return { r: 229, g: 231, b: 235 }; // fallback claro
      const parts = raw.split(/\s+/);
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1].replace('%', ''));
      const l = parseFloat(parts[2].replace('%', ''));
      return hslToRgb(h, s, l);
    } catch {
      return { r: 229, g: 231, b: 235 };
    }
  };

  // Cores para diferentes níveis da rede - gradiente baseado no tema selecionado
  const generateLevelColors = (maxLevel: number) => {
    const colors = [];
    const maxLevels = Math.max(maxLevel, 4);
    const themeColor = getThemeColors();

    for (let i = 0; i <= maxLevels; i++) {
      // Criar gradiente do escuro para claro baseado no tema
      const factor = i / Math.max(maxLevels, 1);

      // Gradiente: do escuro (nível 0) para claro (níveis maiores)
      const r = Math.round(themeColor.r + (255 - themeColor.r) * factor * 0.4);
      const g = Math.round(themeColor.g + (255 - themeColor.g) * factor * 0.4);
      const b = Math.round(themeColor.b + (255 - themeColor.b) * factor * 0.2);

      colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    return colors;
  };

  // Calcular cores do nível baseado no tema atual (recalcula quando tema ou nodes mudam)
  const levelColors = useMemo(() => {
    return generateLevelColors(nodes.length > 0 ? Math.max(...nodes.map(n => n.level)) : 4);
  }, [nodes, colorTheme]);

  // Calcular métricas em tempo real
  const calculateRealTimeMetrics = useMemo(() => {
    if (nodes.length === 0) return realTimeMetrics;

    const totalLTV = nodes.reduce((sum, node) => sum + node.ltv, 0);
    const totalIndications = nodes.reduce((sum, node) => sum + node.indicacoes_count, 0);
    const avgIndicationsPerNode = totalIndications / nodes.length;

    // Calcular taxa de crescimento baseada em created_at
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    const startCurrent = new Date(now.getTime() - 30 * msInDay);
    const startPrevious = new Date(startCurrent.getTime() - 30 * msInDay);

    const currentPeriodCount = clientes.filter(c => {
      const d = new Date(c.created_at);
      return d >= startCurrent && d <= now;
    }).length;

    const previousPeriodCount = clientes.filter(c => {
      const d = new Date(c.created_at);
      return d >= startPrevious && d < startCurrent;
    }).length;

    let networkGrowthRate = 0;
    if (previousPeriodCount === 0) {
      networkGrowthRate = currentPeriodCount > 0 ? 100 : 0;
    } else {
      networkGrowthRate = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
    }

    // Top performers (top 3 por indicacoes_count)
    const topPerformers = [...nodes]
      .sort((a, b) => b.indicacoes_count - a.indicacoes_count)
      .slice(0, 3)
      .map(node => ({ id: node.id, name: node.name, indicacoes_count: node.indicacoes_count }));

    return {
      totalLTV,
      avgIndicationsPerNode: Math.round(avgIndicationsPerNode * 100) / 100,
      networkGrowthRate: Math.round(networkGrowthRate * 100) / 100,
      topPerformers
    };
  }, [nodes, clientes]);

  // Calcular dados do heatmap baseado na performance
  const calculateHeatmapData = useMemo(() => {
    const heatmap = new Map<string, number>();

    nodes.forEach(node => {
      // Calcular score de performance baseado em LTV e indicações
      const performanceScore = (node.ltv / 1000) + (node.indicacoes_count * 10);
      heatmap.set(node.id, Math.min(performanceScore, 100)); // Normalizar para 0-100
    });

    return heatmap;
  }, [nodes]);

  // Gerar dados temporais simulados
  const generateTemporalData = useMemo(() => {
    const data = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      // Simular crescimento da rede ao longo do tempo
      const baseCount = Math.max(1, nodes.length - (i * 2));
      const baseLTV = nodes.reduce((sum, node) => sum + node.ltv, 0) * (baseCount / nodes.length);

      data.push({
        date: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        count: Math.round(baseCount),
        ltv: Math.round(baseLTV)
      });
    }

    return data;
  }, [nodes]);

  // Função de animação suave
  const animateLayoutTransition = (newNodes: NetworkNode[]) => {
    if (nodes.length === 0) {
      setNodes(newNodes);
      return;
    }

    setPreviousNodes([...nodes]);
    setIsAnimating(true);
    setAnimationProgress(0);

    const startTime = Date.now();
    const duration = animationSpeed;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Função de easing suave (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setNodes(newNodes);
        setPreviousNodes([]);
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    generateNetworkNodes();
  }, [clientes, layoutMode, colorTheme]);

  useEffect(() => {
    drawNetwork();
  }, [nodes, zoom, pan, selectedNode, hoveredNode, showLabels, highlightedNodes, isAnimating, animationProgress, previousNodes, colorTheme, theme]);

  // Redesenhar logo após alternar tema, garantindo que variáveis CSS sejam aplicadas
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      drawNetwork();
    });
    return () => cancelAnimationFrame(raf);
  }, [theme]);


  // Função para aplicar filtros avançados
  const applyAdvancedFilters = () => {
    let filteredNodes = nodes;

    // Filtro por termo de busca
    if (filterTerm) {
      filteredNodes = filteredNodes.filter(node =>
        node.name.toLowerCase().includes(filterTerm.toLowerCase())
      );
    }

    // Filtro por período
    if (periodFilter !== "all") {
      const now = new Date();
      const cliente = clientes.find(c => c.id === filteredNodes[0]?.id);

      filteredNodes = filteredNodes.filter(node => {
        const cliente = clientes.find(c => c.id === node.id);
        if (!cliente) return false;

        const createdDate = new Date(cliente.created_at);
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (periodFilter) {
          case "7days": return daysDiff <= 7;
          case "30days": return daysDiff <= 30;
          case "90days": return daysDiff <= 90;
          case "1year": return daysDiff <= 365;
          default: return true;
        }
      });
    }

    // Filtro por LTV
    filteredNodes = filteredNodes.filter(node =>
      node.ltv >= ltvRange[0] && node.ltv <= ltvRange[1]
    );

    // Filtro por status (baseado no número de indicações)
    if (statusFilter !== "all") {
      filteredNodes = filteredNodes.filter(node => {
        switch (statusFilter) {
          case "high": return node.indicacoes_count >= 3;
          case "medium": return node.indicacoes_count >= 1 && node.indicacoes_count < 3;
          case "low": return node.indicacoes_count === 0;
          default: return true;
        }
      });
    }

    const filtered = new Set(filteredNodes.map(node => node.id));
    setHighlightedNodes(filtered);
  };

  useEffect(() => {
    applyAdvancedFilters();
  }, [filterTerm, nodes, periodFilter, ltvRange, statusFilter]);

  const generateNetworkNodes = () => {
    const nodeMap = new Map<string, NetworkNode>();
    const connections = new Map<string, string[]>();

    // Primeiro, criar todos os nós
    clientes.forEach(cliente => {
      const indicacoes_count = clientes.filter(c => c.indicado_por === cliente.id).length;

      nodeMap.set(cliente.id, {
        id: cliente.id,
        name: cliente.nome,
        x: 0,
        y: 0,
        connections: [],
        level: 0,
        ltv: cliente.ltv || 0,
        isRoot: !cliente.indicado_por,
        indicacoes_count
      });

      if (!connections.has(cliente.id)) {
        connections.set(cliente.id, []);
      }
    });

    // Estabelecer conexões
    clientes.forEach(cliente => {
      if (cliente.indicado_por && nodeMap.has(cliente.indicado_por)) {
        const parentConnections = connections.get(cliente.indicado_por) || [];
        parentConnections.push(cliente.id);
        connections.set(cliente.indicado_por, parentConnections);

        const childConnections = connections.get(cliente.id) || [];
        childConnections.push(cliente.indicado_por);
        connections.set(cliente.id, childConnections);
      }
    });

    // Calcular níveis (profundidade na árvore)
    const calculateLevels = (nodeId: string, level: number, visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (node) {
        node.level = Math.max(node.level, level);
        const nodeConnections = connections.get(nodeId) || [];
        nodeConnections.forEach(connectedId => {
          const connectedNode = nodeMap.get(connectedId);
          if (connectedNode && !connectedNode.isRoot) {
            calculateLevels(connectedId, level + 1, visited);
          }
        });
      }
    };

    // Começar pelos nós raiz
    nodeMap.forEach(node => {
      if (node.isRoot) {
        calculateLevels(node.id, 0, new Set());
      }
    });

    // Posicionar nós usando algoritmo de força
    positionNodes(Array.from(nodeMap.values()), connections);

    // Atualizar conexões nos nós
    nodeMap.forEach(node => {
      node.connections = connections.get(node.id) || [];
    });

    const newNodes = Array.from(nodeMap.values());

    // Posicionar nós antes da animação
    positionNodes(newNodes, connections);

    // Usar animação suave para transição
    animateLayoutTransition(newNodes);
  };

  const positionNodes = (nodes: NetworkNode[], connections: Map<string, string[]>) => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Agrupar por nível
    const nodesByLevel = new Map<number, NetworkNode[]>();
    nodes.forEach(node => {
      if (!nodesByLevel.has(node.level)) {
        nodesByLevel.set(node.level, []);
      }
      nodesByLevel.get(node.level)!.push(node);
    });

    // Organizar baseado no modo de layout
    if (layoutMode === 'hierarchical') {
      positionHierarchically(nodesByLevel, width, height);
      // Aplicar forças mínimas apenas para pequenos ajustes
      for (let i = 0; i < 3; i++) {
        applyGentleForces(nodes, connections);
      }
    } else {
      positionCircularly(nodesByLevel, width, height);
      // Aplicar forças para melhor distribuição circular
      for (let i = 0; i < 20; i++) {
        applyForces(nodes, connections);
      }
    }
  };

  const positionCircularly = (nodesByLevel: Map<number, NetworkNode[]>, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    nodesByLevel.forEach((levelNodes, level) => {
      const radius = level === 0 ? 0 : 100 + (level * 80);
      const angleStep = levelNodes.length > 1 ? (2 * Math.PI) / levelNodes.length : 0;

      levelNodes.forEach((node, index) => {
        if (level === 0) {
          // Nós raiz no centro
          node.x = centerX + (index - (levelNodes.length - 1) / 2) * 100;
          node.y = centerY;
        } else {
          // Outros nós em círculos
          const angle = index * angleStep;
          node.x = centerX + Math.cos(angle) * radius;
          node.y = centerY + Math.sin(angle) * radius;
        }
      });
    });
  };

  const positionHierarchically = (nodesByLevel: Map<number, NetworkNode[]>, width: number, height: number) => {
    const maxLevel = Math.max(...nodesByLevel.keys());
    // Usar o mesmo espaçamento vertical das linhas de geração
    const levelHeight = 600 / (maxLevel + 2);
    const startY = levelHeight; // primeira linha de nível
    const nodeOffset = NODE_LINE_OFFSET; // usar offset global

    nodesByLevel.forEach((levelNodes, level) => {
      const yLine = startY + (level * levelHeight);
      const y = yLine - nodeOffset;

      if (level === 0) {
        // Nós raiz: distribuição melhorada
        const totalNodes = levelNodes.length;

        if (totalNodes === 0) return;

        const margin = 100; // Margem das bordas para nós raiz
        const availableWidth = width - (2 * margin);

        if (totalNodes === 1) {
          // Se há apenas um nó raiz, centralizar
          levelNodes[0].x = width / 2;
          levelNodes[0].y = y;
        } else {
          // Distribuir uniformemente pela largura disponível
          const spacing = availableWidth / (totalNodes - 1);

          levelNodes.forEach((node, index) => {
            node.x = margin + (index * spacing);
            node.y = y;
          });
        }
      } else {
        // Nós filhos: distribuição melhorada para evitar agrupamento
        const totalNodes = levelNodes.length;

        if (totalNodes === 0) return;

        // Calcular espaçamento baseado na largura disponível
        const margin = 80; // Margem das bordas
        const availableWidth = width - (2 * margin);
        const spacing = Math.max(120, availableWidth / (totalNodes + 1));

        // Ordenar nós por pai para manter grupos próximos
        const sortedNodes = [...levelNodes].sort((a, b) => {
          const parentA = Array.from(nodesByLevel.get(level - 1) || []).find(p => p.connections.includes(a.id));
          const parentB = Array.from(nodesByLevel.get(level - 1) || []).find(p => p.connections.includes(b.id));

          if (parentA && parentB) {
            return parentA.x - parentB.x;
          }
          return 0;
        });

        // Distribuir nós uniformemente pela largura disponível
        sortedNodes.forEach((node, index) => {
          // Calcular posição X para distribuição uniforme
          const x = margin + spacing + (index * spacing);

          // Garantir que não saia dos limites
          node.x = Math.max(margin, Math.min(width - margin, x));
          node.y = y;
        });
      }
    });
  };

  const applyGentleForces = (nodes: NetworkNode[], connections: Map<string, string[]>) => {
    const repulsionForce = 800; // Reduzido para menos movimento
    const levelConstraint = 2.0; // Força muito forte para manter níveis
    // Calcular espaçamento vertical igual ao usado nas linhas de geração
    const maxLevel = Math.max(...nodes.map(n => n.level));
    const levelHeight = 600 / (maxLevel + 2);
    const startY = levelHeight;
    const nodeOffset = NODE_LINE_OFFSET;

    nodes.forEach(node => {
      let fx = 0;
      let fy = 0;

      // Força de repulsão apenas entre nós muito próximos do mesmo nível
      nodes.forEach(other => {
        if (node.id !== other.id && node.level === other.level) {
          const dx = node.x - other.x;
          const distance = Math.abs(dx);

          if (distance < 120) { // Apenas se muito próximos horizontalmente
            const force = repulsionForce / (distance + 1);
            fx += dx > 0 ? force : -force;
          }
        }
      });

      // Força muito forte para manter alinhamento vertical por nível (coerente com linhas)
      const targetY = (startY + (node.level * levelHeight)) - nodeOffset;
      fy += (targetY - node.y) * levelConstraint;

      // Aplicar forças com movimento mínimo
      node.x += fx * 0.001; // Movimento horizontal mínimo
      node.y += fy * 0.02; // Movimento vertical para correção de nível

      // Manter dentro dos limites
      node.x = Math.max(50, Math.min(750, node.x));
      node.y = Math.max(50, Math.min(600, node.y));
    });
  };

  const applyForces = (nodes: NetworkNode[], connections: Map<string, string[]>) => {
    const repulsionForce = 2000;
    const attractionForce = 0.1;
    const damping = 0.9;

    nodes.forEach(node => {
      let fx = 0;
      let fy = 0;

      // Força de repulsão entre todos os nós
      nodes.forEach(other => {
        if (node.id !== other.id) {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsionForce / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }
      });

      // Força de atração entre nós conectados
      const nodeConnections = connections.get(node.id) || [];
      nodeConnections.forEach(connectedId => {
        const connected = nodes.find(n => n.id === connectedId);
        if (connected) {
          const dx = connected.x - node.x;
          const dy = connected.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          fx += dx * attractionForce;
          fy += dy * attractionForce;
        }
      });

      // Aplicar forças com damping
      node.x += fx * damping * 0.01;
      node.y += fy * damping * 0.01;
    });
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Função de desenho da rede otimizada

    // Configurar alta qualidade e anti-aliasing
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Ajustar resolução para HiDPI
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Escalar contexto para HiDPI
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Configurações de qualidade baseadas no zoom (LOD)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = zoom > 1 ? 'high' : zoom > 0.5 ? 'medium' : 'low';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Configurações de qualidade adaptativas
    const highQuality = zoom > 0.8;
    const mediumQuality = zoom > 0.4;
    const showDetails = zoom > 0.3;

    // Limpeza completa e fundo escuro como espaço
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Fundo baseado na cor do tema (dark mode)
    const bgRgb = getBackgroundRgb();
    ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 1)`;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calcular posições interpoladas durante animação
    let currentNodes = nodes;
    if (isAnimating && previousNodes.length > 0) {
      currentNodes = nodes.map(node => {
        const prevNode = previousNodes.find(p => p.id === node.id);
        if (prevNode) {
          return {
            ...node,
            x: prevNode.x + (node.x - prevNode.x) * animationProgress,
            y: prevNode.y + (node.y - prevNode.y) * animationProgress
          };
        }
        return node;
      });
    }

    // Aplicar transformações
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Desenhar linhas de guia dos níveis hierárquicos (apenas no modo hierárquico)
    if (showDetails && currentNodes.length > 0 && layoutMode === 'hierarchical') {
      const maxLevel = Math.max(...currentNodes.map(n => n.level));
      const levelHeight = 600 / (maxLevel + 2);
      const startY = levelHeight;
      const themeColor = getThemeColors();

      for (let level = 0; level <= maxLevel; level++) {
        const y = startY + (level * levelHeight);

        // Linha horizontal do nível
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.strokeStyle = level === 0 ? `rgba(${themeColor.r}, ${themeColor.g}, ${themeColor.b}, 0.2)` : 'rgba(148, 163, 184, 0.1)';
        ctx.lineWidth = level === 0 ? 2 / zoom : 1 / zoom;
        ctx.setLineDash(level === 0 ? [] : [5 / zoom, 5 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label do nível
        if (zoom > 0.5) {
          ctx.fillStyle = level === 0 ? `rgb(${themeColor.r}, ${themeColor.g}, ${themeColor.b})` : '#6B7280';
          ctx.font = `${10 / zoom}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(
            level === 0 ? 'Nível 0 - Clientes Raiz' : `Nível ${level} - ${level}ª Geração`,
            10,
            y - 5 / zoom
          );
        }
      }
    }

    // Desenhar conexões hierárquicas organizadas
    currentNodes.forEach(node => {
      node.connections.forEach(connectedId => {
        const connected = currentNodes.find(n => n.id === connectedId);
        if (connected) {
          // Desenhar apenas conexões pai -> filho (nível menor -> nível maior)
          const isParentToChild = node.level < connected.level;
          if (!isParentToChild) return;

          const isHighlighted = highlightedNodes.has(node.id) || highlightedNodes.has(connected.id);

          // Raio de energia entre estrelas
          const themeColorForGradient = getThemeColors();

          if (isHighlighted) {
            // Conexão brilhante para destacados
            const energyGradient = ctx.createLinearGradient(node.x, node.y, connected.x, connected.y);
            energyGradient.addColorStop(0, `rgba(${themeColorForGradient.r}, ${themeColorForGradient.g}, ${themeColorForGradient.b}, 0.7)`);
            energyGradient.addColorStop(0.5, `rgba(255, 255, 255, 0.5)`); // Centro um pouco menos brilhante
            energyGradient.addColorStop(1, `rgba(${themeColorForGradient.r}, ${themeColorForGradient.g}, ${themeColorForGradient.b}, 0.7)`);

            // Halo de energia (linha mais grossa e difusa)
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connected.x, connected.y);
            ctx.strokeStyle = `rgba(${themeColorForGradient.r}, ${themeColorForGradient.g}, ${themeColorForGradient.b}, 0.12)`;
            ctx.lineWidth = 4 / zoom;
            ctx.stroke();

            // Linha principal brilhante
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connected.x, connected.y);
            ctx.strokeStyle = energyGradient;
            ctx.lineWidth = 1.5 / zoom;
          } else {
            // Conexão sutil como linha de constelação
            const subtleGradient = ctx.createLinearGradient(node.x, node.y, connected.x, connected.y);
            subtleGradient.addColorStop(0, `rgba(${themeColorForGradient.r}, ${themeColorForGradient.g}, ${themeColorForGradient.b}, 0.12)`);
            subtleGradient.addColorStop(0.5, `rgba(${themeColorForGradient.r}, ${themeColorForGradient.g}, ${themeColorForGradient.b}, 0.2)`);
            subtleGradient.addColorStop(1, `rgba(${themeColorForGradient.r}, ${themeColorForGradient.g}, ${themeColorForGradient.b}, 0.12)`);

            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connected.x, connected.y);
            ctx.strokeStyle = subtleGradient;
            ctx.lineWidth = 0.6 / zoom;
          }
          ctx.globalAlpha = isHighlighted ? 0.8 : 0.45;
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Adicionar seta indicando direção (pai -> filho)
          // Ocultar setas quando zoom < 1 para evitar poluição visual
          if (mediumQuality && zoom >= 1) {
            const arrowSize = 6 / zoom;
            const angle = Math.atan2(connected.y - node.y, connected.x - node.x);

            // Posição da seta (70% do caminho)
            const arrowX = node.x + (connected.x - node.x) * 0.7;
            const arrowY = node.y + (connected.y - node.y) * 0.7;

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
              arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
              arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
              arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
              arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            const themeColorForArrow = getThemeColors();
            ctx.strokeStyle = isHighlighted ? `rgb(${themeColorForArrow.r}, ${themeColorForArrow.g}, ${themeColorForArrow.b})` : 'rgba(148, 163, 184, 0.5)';
            ctx.lineWidth = 1 / zoom;
            ctx.stroke();
          }
        }
      });
    });

    // Desenhar nós com alta qualidade
    currentNodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      const isHighlighted = highlightedNodes.has(node.id);

      // Sistema de tamanhos baseado na geração e indicações
      const baseSize = node.level === 0 ? 16 : // Clientes raiz maiores
        node.level === 1 ? 14 : // 1ª geração
          node.level === 2 ? 12 : // 2ª geração
            10; // 3ª geração+

      const indicationBonus = node.indicacoes_count * 1.5; // Bônus por indicações
      const radius = (baseSize + indicationBonus) / zoom;

      // Sombra do nó (apenas em alta qualidade)
      if (highQuality) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = 1 / zoom; // sombra ainda mais sutil
        ctx.shadowOffsetX = 0.5 / zoom;
        ctx.shadowOffsetY = 0.5 / zoom;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.55, 0, 2 * Math.PI); // reduzir área escura
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.fill();
        ctx.restore();
      }

      // Cor baseada no nível, destaque ou modo analytics
      const themeColor = getThemeColors();
      let baseColor;

      if (analyticsMode === 'heatmap' && showAnalytics) {
        // Modo heatmap: cor baseada na performance
        const performanceScore = calculateHeatmapData.get(node.id) || 0;
        const intensity = performanceScore / 100; // Normalizar 0-1

        // Gradiente de azul (baixa performance) para vermelho (alta performance)
        const r = Math.round(intensity * 255);
        const g = Math.round((1 - intensity) * 100);
        const b = Math.round((1 - intensity) * 255);
        baseColor = `rgb(${r}, ${g}, ${b})`;
      } else if (isHighlighted || isSelected) {
        baseColor = `rgb(${themeColor.r}, ${themeColor.g}, ${themeColor.b})`;
      } else {
        baseColor = levelColors[Math.min(node.level, levelColors.length - 1)];
      }



      // Ponto de luz como constelação
      let rgb = null;

      // Verificar se é hex ou rgb
      if (baseColor.startsWith('#')) {
        rgb = hexToRgb(baseColor);
      } else if (baseColor.startsWith('rgb')) {
        rgb = rgbStringToRgb(baseColor);
      }

      if (rgb) {
        // Criar múltiplas camadas de brilho para efeito de constelação
        const intensity = isSelected || isHighlighted ? 1.5 : 1;
        const coreSize = radius * 0.3; // Núcleo pequeno e brilhante
        const glowSize = radius * 1.3; // Halo externo ainda menor

        // Camada 1: Halo externo (brilho difuso)
        const outerGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowSize
        );
        outerGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 * intensity})`);
        outerGlow.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.05 * intensity})`);
        outerGlow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Camada 2: Brilho médio
        const middleGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 0.75
        );
        middleGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.45 * intensity})`);
        middleGlow.addColorStop(0.45, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.2 * intensity})`);
        middleGlow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.75, 0, 2 * Math.PI);
        ctx.fillStyle = middleGlow;
        ctx.fill();

        // Camada 3: Núcleo brilhante (estrela)
        const coreGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, coreSize
        );
        coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`); // Centro branco brilhante
        coreGlow.addColorStop(0.3, `rgba(${Math.min(255, rgb.r + 50)}, ${Math.min(255, rgb.g + 50)}, ${Math.min(255, rgb.b + 50)}, ${0.8 * intensity})`);
        coreGlow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.35 * intensity})`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, coreSize, 0, 2 * Math.PI);
        ctx.fillStyle = coreGlow;
        ctx.fill();


      }

      // Indicador de LTV (círculo interno com gradiente)
      if (node.ltv > 0) {
        const innerRadius = radius * 0.6;
        const innerGradient = ctx.createRadialGradient(
          node.x - innerRadius * 0.3, node.y - innerRadius * 0.3, 0,
          node.x, node.y, innerRadius
        );
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = innerGradient;
        ctx.fill();
      }

      // Labels mostrados apenas em hover ou seleção
      if (zoom > 0.3 && (hoveredNode === node.id || isSelected)) {
        const fontSize = Math.max(8, (9 / zoom)); // menor e mais fino
        const smallFontSize = Math.max(7, (8 / zoom));
        const fg = getForegroundRgb();

        // Configurar texto de alta qualidade
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Nome do nó com sombra
        if (zoom > 0.5) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 0.8 / zoom; // sombra mais leve
          ctx.shadowOffsetX = 0.5 / zoom;
          ctx.shadowOffsetY = 0.5 / zoom;
        }

        ctx.fillStyle = `rgba(${fg.r}, ${fg.g}, ${fg.b}, ${isSelected || isHighlighted ? 0.9 : 0.75})`;
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(node.name.split(' ')[0], node.x, node.y - radius - 10 / zoom);

        if (zoom > 0.5) {
          ctx.restore();
        }

        // Contador de indicações
        if (node.indicacoes_count > 0 && zoom > 0.4) {
          if (zoom > 0.5) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 1 / zoom;
            ctx.shadowOffsetX = 0.5 / zoom;
            ctx.shadowOffsetY = 0.5 / zoom;
          }

          ctx.fillStyle = `rgba(${fg.r}, ${fg.g}, ${fg.b}, 0.6)`;
          ctx.font = `${smallFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillText(`${node.indicacoes_count} indicações`, node.x, node.y + radius + 15 / zoom);

          if (zoom > 0.5) {
            ctx.restore();
          }
        }
      }
    });

    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    // Encontrar nó clicado
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 15;
    });

    // Seleção única
    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
      // Atualiza cursor enquanto arrasta
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
    else {
      // Detectar nó em hover quando não está arrastando
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - pan.x) / zoom;
      const y = (event.clientY - rect.top - pan.y) / zoom;

      let found: string | null = null;
      for (const node of nodes) {
        // Mesmo cálculo de tamanho base usado no desenho
        const baseSize = node.level === 0 ? 16 : node.level === 1 ? 14 : node.level === 2 ? 12 : 10;
        const indicationBonus = node.indicacoes_count * 1.5;
        const radius = baseSize + indicationBonus;
        const distance = Math.hypot(x - node.x, y - node.y);
        if (distance <= Math.max(10, radius)) {
          found = node.id;
          break;
        }
      }

      setHoveredNode(found);
      // Ajusta cursor visualmente
      if (canvasRef.current) {
        canvasRef.current.style.cursor = found ? 'pointer' : 'move';
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Restaurar cursor e limpar hover quando soltar
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'move';
    }
    setHoveredNode(null);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;
  const clienteData = selectedNode ? clientes.find(c => c.id === selectedNode) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      {(() => {
        const { colorTheme } = useTheme();
        const accentStrongThemes = new Set(["ocean", "sunset", "forest", "purple", "rose"]);
        const headerGradientClass = accentStrongThemes.has(colorTheme)
          ? "bg-gradient-to-r from-primary/5 to-accent/5"
          : "bg-gradient-to-r from-primary/5 to-primary/10";
        return (
          <Card className={`rounded-3xl border border-border/40 ${headerGradientClass} shadow-sm`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Network className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Rede de Indicações</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Visualização das conexões entre clientes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm border border-border/40 rounded-full px-2 py-1 shadow-sm">
                  <Input
                    placeholder="Buscar cliente..."
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="w-56 h-8 rounded-full bg-background/70"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Filtros Avançados"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLayoutMode(layoutMode === 'hierarchical' ? 'circular' : 'hierarchical')}
                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
                    title={`Alternar para layout ${layoutMode === 'hierarchical' ? 'circular' : 'hierárquico'}`}
                  >
                    {layoutMode === 'hierarchical' ? '🌐' : '📊'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLabels(!showLabels)}
                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
                    title={showLabels ? 'Ocultar rótulos' : 'Mostrar rótulos'}
                  >
                    {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })()}

      {/* Painel de Filtros Avançados */}
      {showAdvancedFilters && (
        <Card className="rounded-3xl border border-border/40 shadow-sm bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Filtro por Período */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <label className="text-sm font-medium">Período</label>
                </div>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                    <SelectItem value="1year">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por LTV */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <label className="text-sm font-medium">Valor LTV</label>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={ltvRange}
                    onValueChange={(value) => setLtvRange(value as [number, number])}
                    max={10000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ {ltvRange[0].toLocaleString()}</span>
                    <span>R$ {ltvRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Filtro por Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-medium">Performance</label>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecionar performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as performances</SelectItem>
                    <SelectItem value="high">Alta (3+ indicações)</SelectItem>
                    <SelectItem value="medium">Média (1-2 indicações)</SelectItem>
                    <SelectItem value="low">Baixa (0 indicações)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Velocidade de Animação */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-orange-600" />
                  <label className="text-sm font-medium">Animação</label>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[animationSpeed]}
                    onValueChange={(value) => setAnimationSpeed(value[0])}
                    max={1000}
                    min={100}
                    step={50}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {animationSpeed}ms
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo dos Filtros */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Mostrando {highlightedNodes.size} de {nodes.length} clientes
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPeriodFilter("all");
                    setLtvRange([0, 10000]);
                    setStatusFilter("all");
                    setFilterTerm("");
                  }}
                  className="text-xs"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Visualização da Rede */}
        <Card className="lg:col-span-5 rounded-3xl border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Mapa de Conexões</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
                  className="rounded-xl"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(zoom / 1.2, 0.3))}
                  className="rounded-xl"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetView}
                  className="rounded-xl"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                {/* Exportar e Analytics */}
                <div className="flex items-center gap-1 border-l pl-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="rounded-xl"
                    title="Exportar Visualização"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative bg-muted/20 rounded-2xl overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-[600px] cursor-move"
                style={{ cursor: isDragging ? 'grabbing' : (hoveredNode ? 'pointer' : 'move') }}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />

              {/* Menu de Exportação */}
              {showExportMenu && (
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg min-w-48">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Exportar Visualização</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExportMenu(false)}
                      className="h-4 w-4 p-0"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        // Implementar exportação PNG
                        const canvas = canvasRef.current;
                        if (canvas) {
                          const link = document.createElement('a');
                          link.download = 'rede-indicacoes.png';
                          link.href = canvas.toDataURL();
                          link.click();
                        }
                      }}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Exportar PNG
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        // Implementar exportação SVG (placeholder)
                        console.log('Exportar SVG - Em desenvolvimento');
                      }}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Exportar SVG
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        // Implementar exportação PDF (placeholder)
                        console.log('Exportar PDF - Em desenvolvimento');
                      }}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              )}

              {/* Painel de Analytics removido do overlay; métricas serão exibidas no card de Informações */}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              {levelColors.slice(0, Math.min(4, levelColors.length)).map((color, index) => {
                // Tamanhos baseados na geração (mais sutis)
                const size = index === 0 ? 'w-3.5 h-3.5' : // Clientes raiz
                  index === 1 ? 'w-3 h-3' : // 1ª geração
                    index === 2 ? 'w-2.5 h-2.5' : // 2ª geração
                      'w-2 h-2'; // 3ª geração+

                return (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className={`${size} rounded-full border border-white/20`}
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${color}f0, ${color})`
                      }}
                    />
                    <span className="text-foreground/80">
                      {index === 0 ? 'Clientes Raiz' : `${index}ª Geração`}
                    </span>
                  </div>
                );
              })}
              {levelColors.length > 4 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-0.5">
                    {levelColors.slice(4, 7).map((color, index) => (
                      <div
                        key={index}
                        className="w-1.5 h-1.5 rounded-full border border-white/20"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${color}f0, ${color})`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-foreground/80">Gerações 4+</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Painel de Informações */}
        <Card className="lg:col-span-2 rounded-3xl border-0 shadow-xl">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Informações</h3>

            {/* Seleção múltipla removida */}

            {selectedNodeData && clienteData ? (
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-lg">{selectedNodeData.name}</h4>
                  <p className="text-sm text-muted-foreground">{clienteData.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">LTV:</span>
                    <Badge variant="secondary">
                      R$ {selectedNodeData.ltv.toLocaleString()}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Indicações:</span>
                    <Badge variant="outline">
                      {selectedNodeData.indicacoes_count}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Nível:</span>
                    <Badge
                      style={{
                        backgroundColor: levelColors[Math.min(selectedNodeData.level, levelColors.length - 1)] + '20',
                        color: levelColors[Math.min(selectedNodeData.level, levelColors.length - 1)]
                      }}
                    >
                      {selectedNodeData.level}
                    </Badge>
                  </div>
                </div>

                {/* Detalhes adicionais para preencher o card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade</p>
                    <p className="text-sm">{clienteData.cidade || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Instagram</p>
                    {clienteData.instagram ? (
                      <a href={clienteData.instagram} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">
                        {clienteData.instagram}
                      </a>
                    ) : (
                      <p className="text-sm">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-sm">{new Date(clienteData.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Geração</p>
                    <p className="text-sm">{selectedNodeData.level}</p>
                  </div>
                </div>

                {/* Caminho até a raiz e filhos diretos */}
                <div className="pt-2 border-t space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Caminho até a raiz</p>
                    <p className="text-sm">
                      {(() => {
                        const path: string[] = [];
                        let current: Cliente | undefined = clienteData as Cliente | undefined;
                        const safeLimit = 50;
                        let count = 0;
                        while (current && count < safeLimit) {
                          path.push(current.nome);
                          if (!current.indicado_por) break;
                          current = clientes.find(c => c.id === current!.indicado_por) as Cliente | undefined;
                          count++;
                        }
                        return path.join(' → ');
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Filhos diretos</p>
                    <p className="text-sm">
                      {clientes.filter(c => c.indicado_por === clienteData.id).map(c => c.nome).join(', ') || '—'}
                    </p>
                  </div>
                </div>

                {clienteData.indicado_por && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Indicado por:</p>
                    <p className="font-medium">
                      {clientes.find(c => c.id === clienteData.indicado_por)?.nome || 'Cliente não encontrado'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Clique em um nó para ver detalhes</p>
              </div>
            )}

            <div className="mt-3 pt-2 border-t">
              <h4 className="font-medium">Métricas em Tempo Real</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">LTV Total</p>
                  <p className="text-lg font-semibold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateRealTimeMetrics.totalLTV)}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Média Indicações</p>
                  <p className="text-lg font-semibold text-primary">{calculateRealTimeMetrics.avgIndicationsPerNode}</p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Taxa Crescimento</p>
                  <p className={`text-lg font-semibold ${calculateRealTimeMetrics.networkGrowthRate >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {`${Math.round(calculateRealTimeMetrics.networkGrowthRate)}%`}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Top Performers</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {calculateRealTimeMetrics.topPerformers.length > 0 ? (
                      calculateRealTimeMetrics.topPerformers.map(tp => (
                        <span key={tp.id} className="text-sm font-medium text-primary">
                          {tp.name} ({tp.indicacoes_count})
                        </span>
                      ))
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Estatísticas Gerais */}
            <div className="mt-3 pt-2 border-t space-y-1">
              <h4 className="font-medium">Estatísticas da Rede</h4>

              <div className="space-y-0.5 text-sm">
                <div className="flex justify-between">
                  <span>Total de Clientes:</span>
                  <span className="font-medium">{nodes.length}</span>
                </div>

                <div className="flex justify-between">
                  <span>Clientes Raiz:</span>
                  <span className="font-medium">{nodes.filter(n => n.isRoot).length}</span>
                </div>

                <div className="flex justify-between">
                  <span>Total de Indicações:</span>
                  <span className="font-medium">{nodes.reduce((sum, n) => sum + n.indicacoes_count, 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Níveis Máximos:</span>
                  <span className="font-medium">{Math.max(...nodes.map(n => n.level)) + 1}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}