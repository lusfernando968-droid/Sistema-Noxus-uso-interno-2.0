import { useState, useEffect } from 'react';

interface TemporaryReferral {
  clienteId: string;
  indicadoPor: string | null;
}

const STORAGE_KEY = 'temporary_referrals';

export function useTemporaryReferrals() {
  const [referrals, setReferrals] = useState<TemporaryReferral[]>([]);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setReferrals(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar indicações temporárias:', error);
        setReferrals([]);
      }
    }
  }, []);

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(referrals));
  }, [referrals]);

  const setReferral = (clienteId: string, indicadoPor: string | null) => {
    setReferrals(prev => {
      const existing = prev.find(r => r.clienteId === clienteId);
      if (existing) {
        // Atualizar existente
        return prev.map(r => 
          r.clienteId === clienteId 
            ? { ...r, indicadoPor } 
            : r
        );
      } else {
        // Adicionar novo
        return [...prev, { clienteId, indicadoPor }];
      }
    });
  };

  const getReferral = (clienteId: string): string | null => {
    const referral = referrals.find(r => r.clienteId === clienteId);
    return referral?.indicadoPor || null;
  };

  const removeReferral = (clienteId: string) => {
    setReferrals(prev => prev.filter(r => r.clienteId !== clienteId));
  };

  const clearAllReferrals = () => {
    setReferrals([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportReferrals = () => {
    return referrals;
  };

  const importReferrals = (data: TemporaryReferral[]) => {
    setReferrals(data);
  };

  return {
    setReferral,
    getReferral,
    removeReferral,
    clearAllReferrals,
    exportReferrals,
    importReferrals,
    referrals
  };
}