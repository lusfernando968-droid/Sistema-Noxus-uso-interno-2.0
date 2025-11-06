import { useRef, useCallback, useEffect } from "react";

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

interface GestureState {
  isActive: boolean;
  startDistance: number;
  startCenter: { x: number; y: number };
  currentScale: number;
  currentPan: { x: number; y: number };
}

interface UseTouchGesturesOptions {
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }, center: { x: number; y: number }) => void;
  onTap?: (point: { x: number; y: number }) => void;
  onDoubleTap?: (point: { x: number; y: number }) => void;
  onLongPress?: (point: { x: number; y: number }) => void;
  minScale?: number;
  maxScale?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

export function useTouchGestures(options: UseTouchGesturesOptions = {}) {
  const {
    onPinch,
    onPan,
    onTap,
    onDoubleTap,
    onLongPress,
    minScale = 0.5,
    maxScale = 3,
    longPressDelay = 500,
    doubleTapDelay = 300,
  } = options;

  const gestureState = useRef<GestureState>({
    isActive: false,
    startDistance: 0,
    startCenter: { x: 0, y: 0 },
    currentScale: 1,
    currentPan: { x: 0, y: 0 },
  });

  const touchPoints = useRef<TouchPoint[]>([]);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Calcula distância entre dois pontos
  const getDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calcula centro entre dois pontos
  const getCenter = useCallback((p1: TouchPoint, p2: TouchPoint): { x: number; y: number } => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }, []);

  // Converte touch para ponto
  const touchToPoint = useCallback((touch: Touch): TouchPoint => {
    return {
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
    };
  }, []);

  // Limpa timer de long press
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Utilitário: não bloquear eventos em campos de formulário
  const isEditableTarget = useCallback((target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    const role = el.getAttribute?.('role');
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      el.isContentEditable ||
      role === 'textbox'
    );
  }, []);

  // Handler para início do toque
  const handleTouchStart = useCallback((event: TouchEvent) => {
    // Não bloquear interação em elementos editáveis
    if (!isEditableTarget(event.target)) {
      event.preventDefault();
    }
    
    const touches = Array.from(event.touches).map(touchToPoint);
    touchPoints.current = touches;

    if (touches.length === 1) {
      // Single touch - possível tap ou long press
      const point = touches[0];
      
      // Inicia timer para long press
      longPressTimer.current = setTimeout(() => {
        if (onLongPress && touchPoints.current.length === 1) {
          onLongPress(point);
        }
      }, longPressDelay);

    } else if (touches.length === 2) {
      // Dois toques - pinch/zoom
      clearLongPressTimer();
      
      const [p1, p2] = touches;
      const distance = getDistance(p1, p2);
      const center = getCenter(p1, p2);

      gestureState.current = {
        isActive: true,
        startDistance: distance,
        startCenter: center,
        currentScale: 1,
        currentPan: { x: 0, y: 0 },
      };
    }
  }, [touchToPoint, getDistance, getCenter, onLongPress, longPressDelay]);

  // Handler para movimento do toque
  const handleTouchMove = useCallback((event: TouchEvent) => {
    // Não bloquear rolagem/seleção em campos editáveis
    if (!isEditableTarget(event.target)) {
      event.preventDefault();
    }
    
    const touches = Array.from(event.touches).map(touchToPoint);
    
    if (touches.length === 1 && touchPoints.current.length === 1) {
      // Single touch move - pan
      clearLongPressTimer();
      
      const current = touches[0];
      const start = touchPoints.current[0];
      const delta = {
        x: current.x - start.x,
        y: current.y - start.y,
      };

      if (onPan) {
        onPan(delta, current);
      }

    } else if (touches.length === 2 && gestureState.current.isActive) {
      // Dois toques - pinch/zoom
      const [p1, p2] = touches;
      const distance = getDistance(p1, p2);
      const center = getCenter(p1, p2);

      const scale = distance / gestureState.current.startDistance;
      const clampedScale = Math.max(minScale, Math.min(maxScale, scale));

      gestureState.current.currentScale = clampedScale;

      if (onPinch) {
        onPinch(clampedScale, center);
      }
    }

    touchPoints.current = touches;
  }, [touchToPoint, getDistance, getCenter, onPan, onPinch, minScale, maxScale, clearLongPressTimer]);

  // Handler para fim do toque
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    // Permitir que o tap/click finalize foco em inputs
    if (!isEditableTarget(event.target)) {
      event.preventDefault();
    }
    
    clearLongPressTimer();
    
    const touches = Array.from(event.touches).map(touchToPoint);
    
    if (touches.length === 0 && touchPoints.current.length === 1) {
      // Single tap
      const point = touchPoints.current[0];
      const now = Date.now();
      
      if (now - lastTapTime.current < doubleTapDelay) {
        // Double tap
        if (onDoubleTap) {
          onDoubleTap(point);
        }
      } else {
        // Single tap
        setTimeout(() => {
          if (Date.now() - lastTapTime.current >= doubleTapDelay) {
            if (onTap) {
              onTap(point);
            }
          }
        }, doubleTapDelay);
      }
      
      lastTapTime.current = now;
    }

    if (touches.length < 2) {
      gestureState.current.isActive = false;
    }

    touchPoints.current = touches;
  }, [touchToPoint, onTap, onDoubleTap, doubleTapDelay, clearLongPressTimer]);

  // Adiciona event listeners
  const attachGestures = useCallback((element: HTMLElement | SVGSVGElement | HTMLCanvasElement) => {
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return {
    attachGestures,
    gestureState: gestureState.current,
  };
}

// Hook específico para canvas/SVG
export function useCanvasTouchGestures(
  canvasRef: React.RefObject<HTMLCanvasElement | SVGSVGElement>,
  options: {
    onZoom?: (scale: number, center: { x: number; y: number }) => void;
    onPan?: (delta: { x: number; y: number }) => void;
    onTap?: (point: { x: number; y: number }) => void;
    onDoubleTap?: (point: { x: number; y: number }) => void;
  } = {}
) {
  const { onZoom, onPan, onTap, onDoubleTap } = options;

  const { attachGestures } = useTouchGestures({
    onPinch: onZoom,
    onPan: (delta) => onPan?.(delta),
    onTap,
    onDoubleTap,
    minScale: 0.1,
    maxScale: 5,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return attachGestures(canvas);
  }, [canvasRef, attachGestures]);
}