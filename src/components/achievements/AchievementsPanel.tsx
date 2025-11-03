import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trophy, Award, Target, RotateCcw } from 'lucide-react';
import { useAchievementNotifications, Achievement } from '@/hooks/useAchievementNotifications';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export function AchievementsPanel() {
  const { getUserAchievements, resetAchievements } = useAchievementNotifications();
  const { playSound } = useSoundEffects();
  const [isOpen, setIsOpen] = useState(false);
  const [achievements, setAchievements] = useState(getUserAchievements());

  // Atualiza as conquistas quando o componente é montado ou quando há mudanças
  useEffect(() => {
    const updateAchievements = () => {
      setAchievements(getUserAchievements());
    };

    // Atualiza imediatamente
    updateAchievements();

    // Escuta mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('achievement_')) {
        updateAchievements();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Atualiza a cada 2 segundos para capturar mudanças na mesma aba
    const interval = setInterval(updateAchievements, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [getUserAchievements]);

  const completedCount = achievements.filter(a => a.isCompleted).length;
  const totalCount = achievements.length;

  const handleOpenDialog = () => {
    playSound('click');
    setIsOpen(true);
  };

  const handleResetAchievements = () => {
    playSound('click');
    resetAchievements();
    // Atualiza o estado local imediatamente
    setAchievements(getUserAchievements());
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min((achievement.currentValue / achievement.threshold) * 100, 100);
  };

  const formatValue = (achievement: Achievement) => {
    if (achievement.type === 'receita_milestone') {
      return `R$ ${achievement.currentValue.toLocaleString()}`;
    }
    return achievement.currentValue.toString();
  };

  const formatThreshold = (achievement: Achievement) => {
    if (achievement.type === 'receita_milestone') {
      return `R$ ${achievement.threshold.toLocaleString()}`;
    }
    return achievement.threshold.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleOpenDialog}
          className="gap-2 rounded-xl relative"
        >
          <Trophy className="w-4 h-4" />
          Conquistas
          {completedCount > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-full">
              {completedCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Suas Conquistas
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} de {totalCount} conquistas desbloqueadas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAchievements}
              className="gap-2 rounded-xl"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progresso Geral */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <Award className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Progresso Geral</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedCount} conquistas desbloqueadas
                  </p>
                  <Progress 
                    value={(completedCount / totalCount) * 100} 
                    className="mt-2"
                  />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-500">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Conquistas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`rounded-2xl transition-all ${
                  achievement.isCompleted 
                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20' 
                    : 'opacity-75'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${achievement.isCompleted ? 'grayscale-0' : 'grayscale'}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{achievement.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {achievement.description.replace('{threshold}', formatThreshold(achievement))}
                        </CardDescription>
                      </div>
                    </div>
                    {achievement.isCompleted && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 rounded-xl">
                        <Trophy className="w-3 h-3 mr-1" />
                        Completa
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso:</span>
                      <span className="font-medium">
                        {formatValue(achievement)} / {formatThreshold(achievement)}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(achievement)}
                      className="h-2"
                    />
                    {achievement.isCompleted && achievement.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Desbloqueada em {new Date(achievement.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dicas */}
          <Card className="rounded-2xl bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-700">Dicas para Conquistar Metas</h4>
                  <ul className="text-sm text-blue-600 mt-2 space-y-1">
                    <li>• Continue cadastrando clientes para desbloquear "Mestre dos Relacionamentos"</li>
                    <li>• Crie mais projetos para se tornar um "Gerente de Projetos"</li>
                    <li>• Registre transações financeiras para ser um "Controlador Financeiro"</li>
                    <li>• Organize sua agenda para se tornar um "Organizador Expert"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}