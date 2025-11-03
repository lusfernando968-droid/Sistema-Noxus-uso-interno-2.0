import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'client' | 'project' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

export function HeaderNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Simulação de notificações em tempo real
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'appointment',
        title: 'Novo Agendamento',
        message: 'Maria Silva agendou uma sessão para amanhã às 14h',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'high'
      },
      {
        id: '2',
        type: 'payment',
        title: 'Pagamento Recebido',
        message: 'R$ 800,00 recebido de João Santos',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'client',
        title: 'Cliente Inativo',
        message: 'Ana Costa não faz agendamentos há 90 dias',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: 'low'
      },
      {
        id: '4',
        type: 'project',
        title: 'Projeto Concluído',
        message: 'Tatuagem das costas de Pedro Lima finalizada',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        priority: 'medium'
      },
      {
        id: '5',
        type: 'system',
        title: 'Meta Atingida',
        message: 'Parabéns! Meta de receita mensal atingida',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: true,
        priority: 'high'
      }
    ];

    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);

    // Simular novas notificações a cada 45 segundos
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

      setNotifications(prev => [newNotification, ...prev.slice(0, 7)]); // Manter apenas 8 notificações
      setUnreadCount(prev => prev + 1);
    }, 45000);

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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl relative">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-primary" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-96 p-0 rounded-3xl border-0 shadow-2xl bg-background/95 backdrop-blur-xl"
        sideOffset={8}
      >
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 px-2 text-xs rounded-xl"
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
          </CardHeader>
          
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const colorClasses = getNotificationColor(notification.type, notification.priority);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-2xl border transition-all hover:shadow-sm cursor-pointer ${
                      notification.read 
                        ? 'bg-muted/20 border-muted/30' 
                        : 'bg-background border-primary/20 shadow-sm'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-xl ${colorClasses} flex-shrink-0`}>
                        <IconComponent className="w-3 h-3" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium text-xs truncate ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="h-4 w-4 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {notifications.length > 6 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs rounded-xl">
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}