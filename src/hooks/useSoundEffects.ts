import { useCallback } from 'react';
import { useSoundContext } from '@/contexts/SoundContext';

export type SoundType = 'success' | 'error' | 'click' | 'notification' | 'drag' | 'drop' | 'darkMode' | 'dock' | 'hover' | 'focus' | 'tab' | 'modal' | 'toggle' | 'slide' | 'whoosh' | 'pop' | 'chime' | 'beep';

export const useSoundEffects = () => {
  const { isSoundEnabled } = useSoundContext();

  const createSound = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    if (!isSoundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Erro ao reproduzir som:', error);
    }
  }, [isSoundEnabled]);

  const createComplexSound = useCallback((notes: Array<{ frequency: number; duration: number; delay?: number }>) => {
    if (!isSoundEnabled) return;

    notes.forEach(note => {
      setTimeout(() => {
        createSound(note.frequency, note.duration);
      }, (note.delay || 0) * 1000);
    });
  }, [isSoundEnabled, createSound]);

  const playSound = useCallback((type: SoundType) => {
    if (!isSoundEnabled) return;

    switch (type) {
      case 'success':
        // Som de sucesso - sequência ascendente alegre
        createComplexSound([
          { frequency: 523.25, duration: 0.1 }, // C5
          { frequency: 659.25, duration: 0.1, delay: 0.1 }, // E5
          { frequency: 783.99, duration: 0.2, delay: 0.2 }, // G5
        ]);
        break;
      
      case 'error':
        // Som de erro - tom grave e sério
        createComplexSound([
          { frequency: 220, duration: 0.3 }, // A3
          { frequency: 196, duration: 0.3, delay: 0.15 }, // G3
        ]);
        break;
      
      case 'click':
        // Som de clique - rápido e sutil
        createSound(800, 0.1);
        break;
      
      case 'notification':
        // Som de notificação - suave e chamativo
        createComplexSound([
          { frequency: 880, duration: 0.15 }, // A5
          { frequency: 1108.73, duration: 0.15, delay: 0.1 }, // C#6
        ]);
        break;
      
      case 'drag':
        // Som de arrastar - tom baixo contínuo
        createSound(300, 0.2);
        break;
      
      case 'drop':
        // Som de soltar - tom que desce
        createComplexSound([
          { frequency: 600, duration: 0.1 },
          { frequency: 400, duration: 0.1, delay: 0.05 },
        ]);
        break;
      
      case 'darkMode':
        // Som UI Sound off - sutil e minimalista como desligar interface
        createComplexSound([
          { frequency: 800.00, duration: 0.06 }, // Tom agudo inicial
          { frequency: 600.00, duration: 0.08, delay: 0.04 }, // Transição média
          { frequency: 400.00, duration: 0.10, delay: 0.08 }, // Descida suave
          { frequency: 200.00, duration: 0.12, delay: 0.12 }, // Final grave - "off"
        ]);
        break;
      
      case 'dock':
        // Som oco e espacial para o dock - como um eco em caverna tecnológica
        createComplexSound([
          { frequency: 110.00, duration: 0.18 }, // A2 - base muito grave e oca
          { frequency: 146.83, duration: 0.16, delay: 0.08 }, // D3 - harmônico oco
          { frequency: 174.61, duration: 0.14, delay: 0.16 }, // F3 - ressonância
          { frequency: 130.81, duration: 0.16, delay: 0.24 }, // C3 - eco espacial
          { frequency: 98.00, duration: 0.20, delay: 0.32 }, // G2 - final profundo e oco
        ]);
        break;

      case 'hover':
        // Som sutil para hover - muito suave
        createSound(1200, 0.05, 0.03);
        break;

      case 'focus':
        // Som de foco - suave e agudo
        createSound(1000, 0.08, 0.05);
        break;

      case 'tab':
        // Som para mudança de aba - elegante
        createComplexSound([
          { frequency: 700, duration: 0.08 },
          { frequency: 900, duration: 0.08, delay: 0.04 },
        ]);
        break;

      case 'modal':
        // Som para abertura de modal - chamativo mas suave
        createComplexSound([
          { frequency: 600, duration: 0.12 },
          { frequency: 800, duration: 0.12, delay: 0.06 },
          { frequency: 1000, duration: 0.15, delay: 0.12 },
        ]);
        break;

      case 'toggle':
        // Som para toggle/switch - rápido e definido
        createComplexSound([
          { frequency: 800, duration: 0.06 },
          { frequency: 1200, duration: 0.06, delay: 0.03 },
        ]);
        break;

      case 'slide':
        // Som para slider - suave e contínuo
        createSound(500, 0.15, 0.06);
        break;

      case 'whoosh':
        // Som de movimento rápido - para transições
        createComplexSound([
          { frequency: 200, duration: 0.1 },
          { frequency: 400, duration: 0.08, delay: 0.02 },
          { frequency: 600, duration: 0.06, delay: 0.04 },
          { frequency: 800, duration: 0.04, delay: 0.06 },
        ]);
        break;

      case 'pop':
        // Som de pop - para aparições súbitas
        createComplexSound([
          { frequency: 1000, duration: 0.05 },
          { frequency: 800, duration: 0.05, delay: 0.02 },
        ]);
        break;

      case 'chime':
        // Som de sino - para notificações importantes
        createComplexSound([
          { frequency: 1047, duration: 0.3 }, // C6
          { frequency: 1319, duration: 0.25, delay: 0.1 }, // E6
          { frequency: 1568, duration: 0.2, delay: 0.2 }, // G6
        ]);
        break;

      case 'beep':
        // Som de beep simples - para alertas
        createSound(1000, 0.1, 0.08);
        break;
      
      default:
        createSound(440, 0.2);
        break;
    }
  }, [isSoundEnabled, createComplexSound, createSound]);

  return { playSound };
};