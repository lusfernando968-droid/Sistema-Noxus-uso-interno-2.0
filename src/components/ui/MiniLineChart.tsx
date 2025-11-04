import React, { useState } from "react";

interface MiniLineChartProps {
  data: number[];
  height?: number;
  className?: string; // controla a cor via text-*
  showArea?: boolean;
  showDot?: boolean;
  grid?: boolean;
  baseline?: boolean;
  lineWidth?: number;
  areaOpacity?: number; // 0..1
  interactive?: boolean; // tooltip simples
  formatValue?: (v: number) => string;
  tooltipAtPoint?: boolean;
}

// Pequeno gráfico de linha responsivo usando SVG com viewBox fixo.
// Usa a cor corrente (currentColor) para seguir o tema via classes Tailwind.
export function MiniLineChart({
  data,
  height = 56,
  className = "text-primary",
  showArea = true,
  showDot = true,
  grid = false,
  baseline = true,
  lineWidth = 1.4,
  areaOpacity = 0.15,
  interactive = false,
  formatValue,
  tooltipAtPoint = true,
}: MiniLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!data || data.length < 2) {
    return <div className="w-full h-[56px] rounded-xl bg-muted/30" />;
  }

  const width = 100;
  const viewHeight = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const yNorm = (v - min) / range; // 0..1
    const y = viewHeight - (yNorm * (viewHeight - 4)) - 2; // margem superior/inf.
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  const areaPath = `${path} L ${width},${viewHeight} L 0,${viewHeight} Z`;
  const last = points[points.length - 1];
  const current = hoverIndex != null ? points[hoverIndex] : last;
  const currentVal = hoverIndex != null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        className="w-full"
        viewBox={`0 0 ${width} ${viewHeight}`}
        style={{ height }}
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          if (!interactive) return;
          const rect = (e.target as SVGElement).getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * width;
          // encontrar ponto mais próximo
          let nearest = 0;
          let best = Infinity;
          for (let i = 0; i < points.length; i++) {
            const d = Math.abs(points[i].x - px);
            if (d < best) { best = d; nearest = i; }
          }
          setHoverIndex(nearest);
        }}
        onMouseLeave={() => interactive && setHoverIndex(null)}
      >
        {/* background subtle */}
        <rect x="0" y="0" width={width} height={viewHeight} className="fill-muted/20" rx="6" />
        {/* grid minimalista */}
        {grid && (
          <g className="stroke-muted/30" strokeWidth={0.5}>
            {[0.25, 0.5, 0.75].map((p) => (
              <line key={p} x1={width * p} y1={2} x2={width * p} y2={viewHeight - 2} />
            ))}
          </g>
        )}
        {baseline && (
          <line x1={2} y1={viewHeight - 4} x2={width - 2} y2={viewHeight - 4} className="stroke-muted/40" strokeWidth={0.6} />
        )}
        {showArea && (
          <path d={areaPath} fill="currentColor" opacity={areaOpacity} />
        )}
        <path d={path} className="stroke-current" strokeWidth={lineWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {showDot && (
          <circle cx={current.x} cy={current.y} r={1.8} className="fill-current" />
        )}
        {/* marcador vertical quando interativo */}
        {interactive && hoverIndex != null && (
          <line x1={current.x} y1={2} x2={current.x} y2={viewHeight - 2} className="stroke-current" strokeWidth={0.5} opacity={0.3} />
        )}
      </svg>
      {interactive && (
        <div
          className="pointer-events-none absolute text-xs"
          style={tooltipAtPoint ? {
            left: `${(current.x / width) * 100}%`,
            top: `${(current.y / viewHeight) * 100}%`,
            transform: 'translate(-50%, -120%)'
          } : { top: '4px', left: '8px' }}
        >
          <div className="px-2 py-1 rounded-md bg-popover/90 text-popover-foreground shadow-sm">
            {formatValue ? formatValue(currentVal) : currentVal}
          </div>
        </div>
      )}
    </div>
  );
}

export default MiniLineChart;