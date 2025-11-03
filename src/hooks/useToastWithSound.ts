import { useToast } from './use-toast';
import { useSoundEffects } from './useSoundEffects';

export const useToastWithSound = () => {
  const { toast: originalToast } = useToast();
  const { playSound } = useSoundEffects();

  const toast = ({ variant = 'default', ...props }: Parameters<typeof originalToast>[0]) => {
    // Toca som baseado no tipo de toast
    if (variant === 'destructive') {
      playSound('error');
    } else {
      playSound('success');
    }

    return originalToast({ variant, ...props });
  };

  return { toast };
};