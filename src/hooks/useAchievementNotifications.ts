import { useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

// Tipos de conquistas/metas
export type AchievementType = 
  | 'clientes_milestone' 
  | 'projetos_milestone' 
  | 'financeiro_milestone'
  | 'agendamentos_milestone'
  
  | 'sessoes_milestone'
  | 'receita_milestone';

// Interface para definir uma conquista
export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  currentValue: number;
  isCompleted: boolean;
  completedAt?: string;
}

// Configurações das metas por página
const ACHIEVEMENT_CONFIGS: Record<AchievementType, Omit<Achievement, 'id' | 'currentValue' | 'isCompleted' | 'completedAt'>> = {
  clientes_milestone: {
    type: 'clientes_milestone',
    title: 'Mestre dos Relacionamentos',
    description: 'Cadastrou {threshold} clientes!',
    icon: '👥',
    threshold: 10
  },
  projetos_milestone: {
    type: 'projetos_milestone', 
    title: 'Gerente de Projetos',
    description: 'Criou {threshold} projetos!',
    icon: '💼',
    threshold: 5
  },
  financeiro_milestone: {
    type: 'financeiro_milestone',
    title: 'Controlador Financeiro',
    description: 'Registrou {threshold} transações!',
    icon: '💰',
    threshold: 20
  },
  agendamentos_milestone: {
    type: 'agendamentos_milestone',
    title: 'Organizador Expert',
    description: 'Agendou {threshold} sessões!',
    icon: '📅',
    threshold: 15
  },

  sessoes_milestone: {
    type: 'sessoes_milestone',
    title: 'Tatuador Produtivo',
    description: 'Completou {threshold} sessões de tatuagem!',
    icon: '🎨',
    threshold: 30
  },
  receita_milestone: {
    type: 'receita_milestone',
    title: 'Empreendedor de Sucesso',
    description: 'Atingiu R$ {threshold} em receitas!',
    icon: '🏆',
    threshold: 5000
  }
};

export const useAchievementNotifications = () => {
  const { toast } = useToast();

  // Função para verificar e disparar notificação de conquista
  const checkAchievement = useCallback((type: AchievementType, currentValue: number) => {
    const config = ACHIEVEMENT_CONFIGS[type];
    const storageKey = `achievement_${type}`;
    const currentStorageKey = `achievement_current_${type}`;
    const lastNotifiedValue = parseInt(localStorage.getItem(storageKey) || '0');

    // Sempre atualiza o valor atual no localStorage
    localStorage.setItem(currentStorageKey, currentValue.toString());

    // Verifica se atingiu uma nova meta
    const newMilestone = Math.floor(currentValue / config.threshold) * config.threshold;
    
    if (newMilestone > lastNotifiedValue && newMilestone >= config.threshold) {
      // Salva o novo valor notificado
      localStorage.setItem(storageKey, newMilestone.toString());
      
      // Dispara a notificação
      showAchievementNotification({
        ...config,
        id: `${type}_${newMilestone}`,
        threshold: newMilestone,
        currentValue,
        isCompleted: true,
        completedAt: new Date().toISOString()
      });
    }

    // Log para debug
    console.log(`🎯 Verificando conquista ${type}:`, {
      currentValue,
      threshold: config.threshold,
      newMilestone,
      lastNotifiedValue,
      shouldNotify: newMilestone > lastNotifiedValue && newMilestone >= config.threshold
    });
  }, []);

  // Função para mostrar notificação de conquista
  const showAchievementNotification = useCallback((achievement: Achievement) => {
    // Toast com design especial
    toast({
      title: `🎉 ${achievement.icon} ${achievement.title}`,
      description: achievement.description.replace('{threshold}', achievement.threshold.toString()),
      duration: 6000, // Mais tempo para conquistas
    });

    // Log da conquista (pode ser enviado para analytics)
    console.log('🏆 Conquista desbloqueada:', achievement);
  }, [toast]);

  // Funções específicas para cada tipo de meta
  const checkClientesMilestone = useCallback((count: number) => {
    checkAchievement('clientes_milestone', count);
  }, [checkAchievement]);

  const checkProjetosMilestone = useCallback((count: number) => {
    checkAchievement('projetos_milestone', count);
  }, [checkAchievement]);

  const checkFinanceiroMilestone = useCallback((count: number) => {
    checkAchievement('financeiro_milestone', count);
  }, [checkAchievement]);

  const checkAgendamentosMilestone = useCallback((count: number) => {
    checkAchievement('agendamentos_milestone', count);
  }, [checkAchievement]);

  

  const checkSessoesMilestone = useCallback((count: number) => {
    checkAchievement('sessoes_milestone', count);
  }, [checkAchievement]);

  const checkReceitaMilestone = useCallback((value: number) => {
    checkAchievement('receita_milestone', value);
  }, [checkAchievement]);

  // Função para obter todas as conquistas do usuário
  const getUserAchievements = useCallback((): Achievement[] => {
    return Object.entries(ACHIEVEMENT_CONFIGS).map(([type, config]) => {
      const storageKey = `achievement_${type}`;
      const currentStorageKey = `achievement_current_${type}`;
      const lastNotifiedValue = parseInt(localStorage.getItem(storageKey) || '0');
      const currentValue = parseInt(localStorage.getItem(currentStorageKey) || '0');
      
      return {
        ...config,
        id: `${type}_current`,
        currentValue: currentValue,
        isCompleted: lastNotifiedValue >= config.threshold,
        completedAt: lastNotifiedValue >= config.threshold ? new Date().toISOString() : undefined
      };
    });
  }, []);

  // Função para resetar conquistas (útil para desenvolvimento/testes)
  const resetAchievements = useCallback(() => {
    Object.keys(ACHIEVEMENT_CONFIGS).forEach(type => {
      localStorage.removeItem(`achievement_${type}`);
      localStorage.removeItem(`achievement_current_${type}`);
    });
    toast({
      title: "🔄 Conquistas Resetadas",
      description: "Todas as conquistas foram resetadas!",
    });
  }, [toast]);

  return {
    // Funções de verificação por página
    checkClientesMilestone,
    checkProjetosMilestone,
    checkFinanceiroMilestone,
    checkAgendamentosMilestone,
    
    checkSessoesMilestone,
    checkReceitaMilestone,
    
    // Funções utilitárias
    getUserAchievements,
    resetAchievements,
    showAchievementNotification,
    
    // Configurações disponíveis
    achievementConfigs: ACHIEVEMENT_CONFIGS
  };
};