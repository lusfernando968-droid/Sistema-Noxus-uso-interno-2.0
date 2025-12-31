import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrcamentoRemarketing {
    id: string;
    nome: string;
    numero: string;
    plataforma_contato: string;
    data_contato: string;
    valor_total: number;
    estilo: string;
    dias_desde_contato: number;
}

export function useOrcamentosRemarketing() {
    const [orcamentos5Dias, setOrcamentos5Dias] = useState<OrcamentoRemarketing[]>([]);
    const [orcamentos30Dias, setOrcamentos30Dias] = useState<OrcamentoRemarketing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrcamentosRemarketing = async () => {
            try {
                setLoading(true);

                // Buscar orçamentos de 5 dias
                const { data: data5, error: error5 } = await supabase
                    .rpc('get_orcamentos_remarketing', { p_dias: 5 });

                if (!error5 && data5) {
                    setOrcamentos5Dias(data5);
                } else if (error5) {
                    console.error('Erro ao buscar orçamentos de 5 dias:', error5);
                }

                // Buscar orçamentos de 30 dias
                const { data: data30, error: error30 } = await supabase
                    .rpc('get_orcamentos_remarketing', { p_dias: 30 });

                if (!error30 && data30) {
                    setOrcamentos30Dias(data30);
                } else if (error30) {
                    console.error('Erro ao buscar orçamentos de 30 dias:', error30);
                }
            } catch (error) {
                console.error('Erro ao buscar orçamentos para remarketing:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrcamentosRemarketing();

        // Atualizar a cada 5 minutos
        const interval = setInterval(fetchOrcamentosRemarketing, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        orcamentos5Dias,
        orcamentos30Dias,
        loading
    };
}
