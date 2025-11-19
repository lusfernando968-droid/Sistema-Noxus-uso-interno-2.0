// Hook para gerenciar efeitos sonoros no app
import { useCallback, useEffect, useState } from 'react';

type SoundType = 'click' | 'success' | 'error' | 'notification';

const SOUND_FILES: Record<SoundType, string> = {
    click: '/sounds/click.mp3',
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    notification: '/sounds/notification.mp3',
};

const STORAGE_KEY = 'noxus-sound-enabled';

export function useSoundEffects() {
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored !== null ? stored === 'true' : true; // Habilitado por padrão
    });

    const [audioCache] = useState<Map<SoundType, HTMLAudioElement>>(() => {
        const cache = new Map<SoundType, HTMLAudioElement>();
        Object.entries(SOUND_FILES).forEach(([type, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = 0.5; // Volume médio
            cache.set(type as SoundType, audio);
        });
        return cache;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, soundEnabled.toString());
    }, [soundEnabled]);

    const playSound = useCallback(
        (type: SoundType) => {
            if (!soundEnabled) return;

            const audio = audioCache.get(type);
            if (audio) {
                // Reiniciar o áudio se já estiver tocando
                audio.currentTime = 0;
                audio.play().catch((error) => {
                    // Ignorar erros de autoplay (alguns navegadores bloqueiam)
                    console.debug('Sound play failed:', error);
                });
            }
        },
        [soundEnabled, audioCache]
    );

    const toggleSound = useCallback(() => {
        setSoundEnabled((prev) => !prev);
    }, []);

    return {
        soundEnabled,
        toggleSound,
        playSound,
    };
}

// Hook singleton para uso global
let globalSoundInstance: ReturnType<typeof useSoundEffects> | null = null;

export function useGlobalSound() {
    if (!globalSoundInstance) {
        throw new Error('SoundProvider not initialized');
    }
    return globalSoundInstance;
}

export function initializeGlobalSound(instance: ReturnType<typeof useSoundEffects>) {
    globalSoundInstance = instance;
}
