import { Conversation } from '@/hooks/useConversations';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConversationSearch } from './ConversationSearch';

interface ConversationListProps {
    conversations: Conversation[];
    selectedPhone: string | null;
    onSelect: (phoneNumber: string) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export function ConversationList({
    conversations,
    selectedPhone,
    onSelect,
    searchTerm,
    onSearchChange
}: ConversationListProps) {
    const formatPhone = (phone: string) => {
        // Remove @s.whatsapp.net se existir
        const cleaned = phone.replace('@s.whatsapp.net', '');
        // Formata: 5511999999999 -> (11) 99999-9999
        if (cleaned.startsWith('55') && cleaned.length >= 12) {
            const ddd = cleaned.substring(2, 4);
            const firstPart = cleaned.substring(4, 9);
            const secondPart = cleaned.substring(9);
            return `(${ddd}) ${firstPart}-${secondPart}`;
        }
        return cleaned;
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Search */}
            <div className="p-3 bg-[#f0f2f5]">
                <ConversationSearch
                    value={searchTerm}
                    onChange={onSearchChange}
                />
            </div>

            {/* Conversations */}
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma conversa ainda</p>
                    <p className="text-sm">As conversas do WhatsApp aparecerão aqui</p>
                </div>
            ) : (
                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {conversations.map((conv) => (
                            <div
                                key={conv.phone_number}
                                className={`p-3 cursor-pointer transition-colors hover:bg-[#f5f6f6] ${selectedPhone === conv.phone_number
                                        ? 'bg-[#f0f2f5]'
                                        : ''
                                    }`}
                                onClick={() => onSelect(conv.phone_number)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-semibold shrink-0">
                                        {conv.phone_number.substring(0, 2)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-sm truncate">
                                                {formatPhone(conv.phone_number)}
                                            </p>
                                            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                                                {formatDistanceToNow(new Date(conv.last_message_at), {
                                                    addSuffix: false,
                                                    locale: ptBR,
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground line-clamp-1 flex-1">
                                                {conv.last_message}
                                            </p>
                                            {conv.message_count > 0 && (
                                                <Badge
                                                    variant="default"
                                                    className="ml-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-[10px] h-5 px-1.5 shrink-0"
                                                >
                                                    {conv.message_count}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
