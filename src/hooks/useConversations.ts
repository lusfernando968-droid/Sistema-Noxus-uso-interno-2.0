import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppRealtime } from './useWhatsAppRealtime';

export interface Conversation {
    phone_number: string;
    last_message: string;
    last_message_at: string;
    message_count: number;
    last_direction: 'inbound' | 'outbound';
}

export interface Message {
    id: string;
    phone_number: string;
    direction: 'inbound' | 'outbound';
    message_text: string;
    intent: string | null;
    created_at: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    // Fetch conversas ativas
    const fetchConversations = useCallback(async () => {
        try {
            console.log('🔄 Buscando conversas...');
            const { data, error } = await supabase.rpc('get_active_conversations');

            console.log('📊 Resultado da RPC:');
            console.log('  - Error:', error);
            console.log('  - Data:', data);
            console.log('  - Quantidade:', data?.length || 0);

            if (error) throw error;

            setConversations(data || []);
        } catch (error: any) {
            console.error('❌ Erro ao buscar conversas:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar conversas',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Fetch mensagens de uma conversa
    const fetchMessages = useCallback(async (phoneNumber: string) => {
        try {
            const { data, error } = await supabase.rpc('get_conversation_messages', {
                p_phone_number: phoneNumber,
            });

            if (error) throw error;

            setMessages(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar mensagens:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar mensagens',
                description: error.message,
            });
        }
    }, [toast]);

    // Envia mensagem manual
    const sendMessage = async (phoneNumber: string, text: string) => {
        setSending(true);
        try {
            // Chama backend do chatbot para enviar mensagem
            const response = await fetch('http://localhost:3001/test-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    number: phoneNumber,
                    message: text,
                }),
            });

            if (!response.ok) {
                throw new Error('Falha ao enviar mensagem');
            }

            toast({
                title: 'Mensagem enviada',
                description: 'A mensagem foi enviada com sucesso!',
            });

            // Recarrega mensagens
            await fetchMessages(phoneNumber);
        } catch (error: any) {
            console.error('Erro ao enviar mensagem:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao enviar mensagem',
                description: error.message,
            });
        } finally {
            setSending(false);
        }
    };

    // Seleciona conversa
    const selectConversation = useCallback((phoneNumber: string) => {
        setSelectedPhone(phoneNumber);
        fetchMessages(phoneNumber);
    }, [fetchMessages]);

    // Handlers para Realtime
    const handleNewMessage = useCallback((message: Message) => {
        // Atualiza mensagens se for da conversa selecionada
        if (selectedPhone === message.phone_number) {
            setMessages(prev => {
                // Evita duplicatas
                if (prev.some(m => m.id === message.id)) {
                    return prev.map(m => m.id === message.id ? message : m);
                }
                return [...prev, message];
            });
        }

        // Atualiza lista de conversas
        fetchConversations();
    }, [selectedPhone, fetchConversations]);

    const handleConversationUpdate = useCallback((conversation: Conversation) => {
        setConversations(prev => {
            const index = prev.findIndex(c => c.phone_number === conversation.phone_number);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = conversation;
                return updated;
            }
            return [conversation, ...prev];
        });
    }, []);

    // Realtime connection
    const { isConnected } = useWhatsAppRealtime(handleNewMessage, handleConversationUpdate);

    // Initial load
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Filtrar conversas por busca
    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations;

        const term = searchTerm.toLowerCase();
        return conversations.filter(conv =>
            conv.phone_number.includes(term) ||
            conv.last_message.toLowerCase().includes(term)
        );
    }, [conversations, searchTerm]);

    return {
        conversations: filteredConversations,
        selectedPhone,
        messages,
        loading,
        sending,
        searchTerm,
        isConnected,
        setSearchTerm,
        selectConversation,
        sendMessage,
        refreshConversations: fetchConversations,
    };
}
