import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useClientInfo } from '@/hooks/useClientInfo';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatView } from '@/components/whatsapp/ChatView';
import { ContactProfile } from '@/components/whatsapp/ContactProfile';
import { CreateClientModal } from '@/components/whatsapp/CreateClientModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Wifi, WifiOff, Info } from 'lucide-react';

export default function ConversasWhatsApp() {
    const {
        conversations,
        selectedPhone,
        messages,
        loading,
        sending,
        searchTerm,
        isConnected,
        setSearchTerm,
        selectConversation,
        sendMessage,
        refreshConversations,
    } = useConversations();

    const [showProfile, setShowProfile] = useState(false);
    const [showCreateClient, setShowCreateClient] = useState(false);
    const { clientInfo, refreshClientInfo } = useClientInfo(selectedPhone);

    const handleClientCreated = () => {
        refreshClientInfo();
        setShowCreateClient(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#25D366] mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando conversas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5] p-0">
            <div className="h-screen flex flex-col">
                {/* Header */}
                <div className="bg-[#00a884] text-white px-6 py-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">WhatsApp Business</h1>
                                <p className="text-sm text-white/80">Central de Atendimento</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                variant={isConnected ? "default" : "destructive"}
                                className="gap-1.5"
                            >
                                {isConnected ? (
                                    <>
                                        <Wifi className="h-3 w-3" />
                                        Conectado
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="h-3 w-3" />
                                        Desconectado
                                    </>
                                )}
                            </Badge>
                            {selectedPhone && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowProfile(!showProfile)}
                                    className="text-white hover:bg-white/10 gap-2"
                                >
                                    <Info className="h-4 w-4" />
                                    {showProfile ? 'Fechar' : 'Info'}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={refreshConversations}
                                className="text-white hover:bg-white/10 gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Atualizar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden shadow-2xl">
                    {/* Lista de Conversas */}
                    <div className="w-full lg:w-[400px] border-r border-gray-200 bg-white">
                        <ConversationList
                            conversations={conversations}
                            selectedPhone={selectedPhone}
                            onSelect={selectConversation}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                        />
                    </div>

                    {/* Chat */}
                    <div className="flex-1 bg-[#efeae2]">
                        <ChatView
                            phoneNumber={selectedPhone}
                            messages={messages}
                            sending={sending}
                            onSendMessage={sendMessage}
                        />
                    </div>

                    {/* Contact Profile Sidebar */}
                    {showProfile && selectedPhone && (
                        <ContactProfile
                            phoneNumber={selectedPhone}
                            onClose={() => setShowProfile(false)}
                            onCreateClient={() => setShowCreateClient(true)}
                            clientInfo={clientInfo}
                        />
                    )}
                </div>
            </div>

            {/* Create Client Modal */}
            {selectedPhone && (
                <CreateClientModal
                    open={showCreateClient}
                    onClose={() => setShowCreateClient(false)}
                    phoneNumber={selectedPhone}
                    onClientCreated={handleClientCreated}
                />
            )}
        </div>
    );
}
