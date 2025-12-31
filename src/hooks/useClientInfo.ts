import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClientInfo {
    id: string;
    nome: string;
    email?: string;
    ltv: number;
}

export function useClientInfo(phoneNumber: string | null) {
    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const { masterId } = useAuth();

    useEffect(() => {
        if (!phoneNumber || !masterId) {
            setClientInfo(null);
            return;
        }

        const fetchClientInfo = async () => {
            setLoading(true);
            try {
                // Remove @s.whatsapp.net se existir
                const cleanPhone = phoneNumber.replace('@s.whatsapp.net', '');

                // Busca cliente por telefone
                const { data, error } = await supabase
                    .from('clientes_com_ltv')
                    .select('id, nome, email, ltv')
                    .eq('user_id', masterId)
                    .eq('telefone', cleanPhone)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                    console.error('Erro ao buscar cliente:', error);
                    return;
                }

                setClientInfo(data);
            } catch (error) {
                console.error('Erro ao buscar cliente:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClientInfo();
    }, [phoneNumber, masterId]);

    const refreshClientInfo = async () => {
        if (!phoneNumber || !masterId) return;

        const cleanPhone = phoneNumber.replace('@s.whatsapp.net', '');
        const { data } = await supabase
            .from('clientes_com_ltv')
            .select('id, nome, email, ltv')
            .eq('user_id', masterId)
            .eq('telefone', cleanPhone)
            .maybeSingle();

        setClientInfo(data);
    };

    return { clientInfo, loading, refreshClientInfo };
}
