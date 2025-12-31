import { useState, useEffect, useRef } from 'react';
import { Message } from '@/hooks/useConversations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { MessageStatus } from './MessageStatus';

interface ChatViewProps {
    phoneNumber: string | null;
    messages: Message[];
    sending: boolean;
    onSendMessage: (phoneNumber: string, text: string) => Promise<void>;
}

export function ChatView({ phoneNumber, messages, sending, onSendMessage }: ChatViewProps) {
    const [messageText, setMessageText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll para última mensagem
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!phoneNumber || !messageText.trim() || sending) return;

        await onSendMessage(phoneNumber, messageText);
        setMessageText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!phoneNumber) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-[#f0f2f5]">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-sm">Escolha uma conversa na lista para visualizar as mensagens</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#efeae2]">
            {/* Header */}
            <div className="bg-[#f0f2f5] border-b px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-semibold">
                    {phoneNumber.substring(0, 2)}
                </div>
                <div className="flex-1">
                    <p className="font-medium text-sm">{phoneNumber}</p>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-2">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <p className="text-sm">Nenhuma mensagem ainda</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${msg.direction === 'outbound'
                                            ? 'bg-[#d9fdd3] rounded-br-none'
                                            : 'bg-white rounded-bl-none'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className="text-[10px] text-gray-500">
                                            {format(new Date(msg.created_at), 'HH:mm')}
                                        </span>
                                        {msg.direction === 'outbound' && (
                                            <MessageStatus
                                                status={msg.status || 'sent'}
                                                className="text-gray-500"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="bg-[#f0f2f5] border-t p-3">
                <div className="flex gap-2 items-end">
                    <Textarea
                        placeholder="Digite uma mensagem"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="resize-none bg-white border-none focus-visible:ring-1 focus-visible:ring-[#25D366]/20 rounded-lg"
                        rows={1}
                        disabled={sending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!messageText.trim() || sending}
                        size="icon"
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-10 w-10 shrink-0"
                    >
                        {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                    Pressione Enter para enviar
                </p>
            </div>
        </div>
    );
}
