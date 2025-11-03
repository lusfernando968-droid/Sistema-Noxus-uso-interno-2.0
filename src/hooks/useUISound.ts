import { useCallback, useEffect } from 'react';
import { useSoundEffects } from './useSoundEffects';

export const useUISound = () => {
  const { playSound } = useSoundEffects();

  // Adiciona sons automaticamente aos elementos da UI
  useEffect(() => {
    const addSoundToElements = () => {
      // Botões
      const buttons = document.querySelectorAll('button:not([data-sound-added])');
      buttons.forEach((button) => {
        button.setAttribute('data-sound-added', 'true');
        button.addEventListener('click', () => {
          const isDestructive = button.classList.contains('destructive') || 
                               button.textContent?.toLowerCase().includes('excluir') ||
                               button.textContent?.toLowerCase().includes('deletar') ||
                               button.textContent?.toLowerCase().includes('remover');
          
          if (isDestructive) {
            playSound('error');
          } else {
            playSound('click');
          }
        });
      });

      // Links e elementos clicáveis
      const links = document.querySelectorAll('a:not([data-sound-added]), [role="button"]:not([data-sound-added])');
      links.forEach((link) => {
        link.setAttribute('data-sound-added', 'true');
        link.addEventListener('click', () => playSound('click'));
      });

      // Inputs e selects
      const inputs = document.querySelectorAll('input:not([data-sound-added]), select:not([data-sound-added]), textarea:not([data-sound-added])');
      inputs.forEach((input) => {
        input.setAttribute('data-sound-added', 'true');
        input.addEventListener('focus', () => playSound('click'));
      });

      // Tabs
      const tabs = document.querySelectorAll('[role="tab"]:not([data-sound-added])');
      tabs.forEach((tab) => {
        tab.setAttribute('data-sound-added', 'true');
        tab.addEventListener('click', () => playSound('notification'));
      });

      // Cards clicáveis
      const cards = document.querySelectorAll('[data-clickable="true"]:not([data-sound-added])');
      cards.forEach((card) => {
        card.setAttribute('data-sound-added', 'true');
        card.addEventListener('click', () => playSound('click'));
      });

      // Elementos de navegação
      const navItems = document.querySelectorAll('nav a:not([data-sound-added]), [data-nav-item]:not([data-sound-added])');
      navItems.forEach((item) => {
        item.setAttribute('data-sound-added', 'true');
        item.addEventListener('click', () => playSound('dock'));
      });

      // Modais e dialogs
      const dialogs = document.querySelectorAll('[role="dialog"]:not([data-sound-added])');
      dialogs.forEach((dialog) => {
        dialog.setAttribute('data-sound-added', 'true');
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
              const target = mutation.target as HTMLElement;
              if (target.getAttribute('data-state') === 'open') {
                playSound('notification');
              }
            }
          });
        });
        observer.observe(dialog, { attributes: true });
      });

      // Elementos drag and drop
      const draggables = document.querySelectorAll('[draggable="true"]:not([data-sound-added])');
      draggables.forEach((draggable) => {
        draggable.setAttribute('data-sound-added', 'true');
        draggable.addEventListener('dragstart', () => playSound('drag'));
        draggable.addEventListener('dragend', () => playSound('drop'));
      });

      // Switches e checkboxes
      const switches = document.querySelectorAll('input[type="checkbox"]:not([data-sound-added]), [role="switch"]:not([data-sound-added])');
      switches.forEach((switchEl) => {
        switchEl.setAttribute('data-sound-added', 'true');
        switchEl.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          if (target.checked) {
            playSound('success');
          } else {
            playSound('click');
          }
        });
      });

      // Sliders
      const sliders = document.querySelectorAll('input[type="range"]:not([data-sound-added])');
      sliders.forEach((slider) => {
        slider.setAttribute('data-sound-added', 'true');
        let isSliding = false;
        
        slider.addEventListener('mousedown', () => {
          isSliding = true;
          playSound('click');
        });
        
        slider.addEventListener('mouseup', () => {
          if (isSliding) {
            playSound('drop');
            isSliding = false;
          }
        });
      });

      // Elementos de menu dropdown
      const dropdowns = document.querySelectorAll('[data-radix-popper-content-wrapper]:not([data-sound-added])');
      dropdowns.forEach((dropdown) => {
        dropdown.setAttribute('data-sound-added', 'true');
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
              const target = mutation.target as HTMLElement;
              if (target.getAttribute('data-state') === 'open') {
                playSound('notification');
              }
            }
          });
        });
        observer.observe(dropdown, { attributes: true });
      });
    };

    // Adiciona sons inicialmente
    addSoundToElements();

    // Observer para novos elementos adicionados dinamicamente
    const observer = new MutationObserver(() => {
      addSoundToElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [playSound]);

  // Funções específicas para casos especiais
  const playSuccessSound = useCallback(() => playSound('success'), [playSound]);
  const playErrorSound = useCallback(() => playSound('error'), [playSound]);
  const playNotificationSound = useCallback(() => playSound('notification'), [playSound]);
  const playClickSound = useCallback(() => playSound('click'), [playSound]);
  const playDragSound = useCallback(() => playSound('drag'), [playSound]);
  const playDropSound = useCallback(() => playSound('drop'), [playSound]);
  const playDarkModeSound = useCallback(() => playSound('darkMode'), [playSound]);
  const playDockSound = useCallback(() => playSound('dock'), [playSound]);

  return {
    playSuccessSound,
    playErrorSound,
    playNotificationSound,
    playClickSound,
    playDragSound,
    playDropSound,
    playDarkModeSound,
    playDockSound,
  };
};