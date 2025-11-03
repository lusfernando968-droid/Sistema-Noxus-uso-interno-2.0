import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  BellRing, 
  Calendar, 
  DollarSign, 
  Users, 
  Briefcase,
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'client' | 'project' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface RealTimeNotificationsProps {
  transacoes: any[];
  clientes: any[];
  projetos: any[];
  agendamentos: any[];
}

export function RealTimeNotifications({ transacoes, clientes, projetos, agendamentos }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulação de notificações em tempo real
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'appointment',
        title: 'Novo Agendamento',
        message: 'Maria Silva agendou uma sessão para amanhã às 14h',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min atrás
        read: false,
        priority: 'high'
      },
      {
        id: '2',
        type: 'payment',
        title: 'Pagamento Recebido',
        message: 'R$ 800,00 recebido de João Santos - Projeto Braço',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min atrás
        read: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'client',
        title: 'Cliente Inativo',
        message: 'Ana Costa não faz agendamentos há 90 dias',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
        read: true,
        priority: 'low'
      },
      {
        id: '4',
        type: 'project',
        title: 'Projeto Concluído',
        message: 'Tatuagem das costas de Pedro Lima foi finalizada',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
        read: false,
        priority: 'medium'
      },
      {
        id: '5',
        type: 'system',
        title: 'Meta Atingida',
        message: 'Parabéns! Você atingiu a meta de receita mensal',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h atrás
        read: true,
        priority: 'high'
      }
    ];

    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);

    // Simular novas notificações a cada 30 segundos
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: ['appointment', 'payment', 'client', 'project'][Math.floor(Math.random() * 4)] as any,
        title: 'Nova Atividade',
        message: 'Uma nova atividade foi detectada no sistema',
        timestamp: new Date(),
        read: false,
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Manter apenas 10 notificações
      setUnreadCount(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return Calendar;
      case 'payment':
        return DollarSign;
      case 'client':
        return Users;
      case 'project':
        return Briefcase;
      case 'system':
        return TrendingUp;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600 bg-red-500/10';
    if (priority === 'medium') return 'text-orange-600 bg-orange-500/10';
    
    switch (type) {
      case 'appointment':
        return 'text-blue-600 bg-blue-500/10';
      case 'payment':
        return 'text-green-600 bg-green-500/10';
      case 'client':
        return 'text-purple-600 bg-purple-500/10';
      case 'project':
        return 'text-indigo-600 bg-indigo-500/10';
      case 'system':
        return 'text-cyan-600 bg-cyan-500/10';
      default:
        return 'text-gray-600 bg-gray-500/10';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs rounded-full">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs rounded-full">Média</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs rounded-full">Baixa</Badge>;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="space-y-4">
      {/* Notification Bell */}
      <Card className="rounded-3xl border-0 bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-xl"
                >
                  {unreadCount > 0 ? (
                    <BellRing className="w-5 h-5 text-primary" />
                  ) : (
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  )}
                </Button>
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold">Notificações</h3>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="rounded-xl text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {isExpanded && (
        <Card className="rounded-3xl border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const colorClasses = getNotificationColor(notification.type, notification.priority);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
                      notification.read 
                        ? 'bg-muted/20 border-muted/30' 
                        : 'bg-background border-primary/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${colorClasses}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(notification.priority)}
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 px-2 text-xs rounded-lg"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Marcar como lida
                              </Button>
                            )}
                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={notification.action.onClick}
                                className="h-6 px-2 text-xs rounded-lg"
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 p-0 rounded-lg"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}