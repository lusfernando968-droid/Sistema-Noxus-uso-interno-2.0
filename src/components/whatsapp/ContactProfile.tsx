import { X, Phone, User, Calendar, Image as ImageIcon, FileText, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ContactProfileProps {
    phoneNumber: string;
    onClose: () => void;
    onCreateClient?: () => void;
    clientInfo?: {
        id: string;
        nome: string;
        email?: string;
        ltv: number;
    } | null;
}

export function ContactProfile({ phoneNumber, onClose, onCreateClient, clientInfo }: ContactProfileProps) {
    const formatPhone = (phone: string) => {
        const cleaned = phone.replace('@s.whatsapp.net', '');
        if (cleaned.startsWith('55') && cleaned.length >= 12) {
            const ddd = cleaned.substring(2, 4);
            const firstPart = cleaned.substring(4, 9);
            const secondPart = cleaned.substring(9);
            return `(${ddd}) ${firstPart}-${secondPart}`;
        }
        return cleaned;
    };

    return (
        <div className="w-full lg:w-[400px] bg-white border-l border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="bg-[#00a884] text-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Informações do Contato</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white hover:bg-white/10 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-semibold mb-3">
                        {phoneNumber.substring(0, 2)}
                    </div>
                    <p className="text-xl font-medium">{formatPhone(phoneNumber)}</p>
                    <p className="text-sm text-white/80">WhatsApp</p>
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {/* Client Info */}
                    {clientInfo ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-900">Cliente Cadastrado</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{clientInfo.nome}</p>
                            {clientInfo.email && (
                                <p className="text-xs text-gray-600 mt-1">{clientInfo.email}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="default" className="bg-green-600">
                                    LTV: R$ {clientInfo.ltv.toLocaleString('pt-BR')}
                                </Badge>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3"
                                onClick={() => window.location.href = `/clientes?id=${clientInfo.id}`}
                            >
                                <Link2 className="h-4 w-4 mr-2" />
                                Ver Perfil Completo
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-blue-900">Não é Cliente</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                                Este contato ainda não está cadastrado no sistema.
                            </p>
                            <Button
                                variant="default"
                                size="sm"
                                className="w-full bg-[#25D366] hover:bg-[#128C7E]"
                                onClick={onCreateClient}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Criar Cliente
                            </Button>
                        </div>
                    )}

                    <Separator />

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-gray-900">Informações</h3>

                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <div>
                                <p className="text-gray-500 text-xs">Telefone</p>
                                <p className="text-gray-900">{formatPhone(phoneNumber)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                                <p className="text-gray-500 text-xs">Última vez online</p>
                                <p className="text-gray-900">Agora</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Media Section */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-gray-900">Mídia Compartilhada</h3>

                        <div className="grid grid-cols-3 gap-2">
                            {/* Placeholder for media */}
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Nenhuma mídia compartilhada ainda
                        </p>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
