// Utility wrapper for adding sound effects to common UI interactions
import { useSoundEffects } from './useSoundEffects';

export function useUISound() {
    const { playSound, soundEnabled } = useSoundEffects();

    const playClickSound = () => {
        playSound('click');
    };

    const playSuccessSound = () => {
        playSound('success');
    };

    const playErrorSound = () => {
        playSound('error');
    };

    const playNotificationSound = () => {
        playSound('notification');
    };

    return {
        soundEnabled,
        playClickSound,
        playSuccessSound,
        playErrorSound,
        playNotificationSound,
    };
}
