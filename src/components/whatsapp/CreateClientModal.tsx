import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface CreateClientModalProps {
    open: boolean;
    onClose: () => void;
    phoneNumber: string;
    onClientCreated?: (clientId: string) => void;
}

export function CreateClientModal({ open, onClose, phoneNumber, onClientCreated }: CreateClientModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        instagram: '',
    });
    const { toast } = useToast();
    const { masterId } = useAuth();

    const formatPhone = (phone: string) => {
        return phone.replace('@s.whatsapp.net', '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome.trim()) {
            toast({
                variant: 'destructive',
                title: 'Nome obrigatório',
                description: 'Por favor, preencha o nome do cliente',
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert([{
                    user_id: masterId,
                    nome: formData.nome,
                    telefone: formatPhone(phoneNumber),
                    email: formData.email || null,
                    instagram: formData.instagram || null,
                }])
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'Cliente criado!',
                description: 'O cliente foi cadastrado com sucesso',
            });

            if (onClientCreated && data) {
                onClientCreated(data.id);
            }

            onClose();
        } catch (error: any) {
            console.error('Erro ao criar cliente:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao criar cliente',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Cadastre este contato como cliente no sistema
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                            id="telefone"
                            value={formatPhone(phoneNumber)}
                            disabled
                            className="bg-gray-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome *</Label>
                        <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Nome completo"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                            id="instagram"
                            value={formData.instagram}
                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                            placeholder="@usuario"
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#25D366] hover:bg-[#128C7E]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                'Criar Cliente'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
