import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Conversation } from './useConversations';

export function useWhatsAppRealtime(
    onNewMessage: (message: Message) => void,
    onConversationUpdate: (conversation: Conversation) => void
) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Canal para mensagens do chatbot
        const messagesChannel = supabase
            .channel('chatbot-messages-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chatbot_logs',
                },
                (payload) => {
                    console.log('📨 Nova mensagem via Realtime:', payload.new);
                    onNewMessage(payload.new as Message);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chatbot_logs',
                },
                (payload) => {
                    console.log('✏️ Mensagem atualizada via Realtime:', payload.new);
                    onNewMessage(payload.new as Message);
                }
            )
            .subscribe((status) => {
                console.log('📡 Status do canal de mensagens:', status);
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            console.log('🔌 Desconectando canal Realtime');
            supabase.removeChannel(messagesChannel);
        };
    }, [onNewMessage, onConversationUpdate]);

    return { isConnected };
}
