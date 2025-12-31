import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityLog {
    id: string;
    assistant_id: string;
    assistant_email: string;
    admin_id: string;
    action_type: 'PAGE_VIEW' | 'CREATE_CLIENT' | 'CREATE_PROJECT' | 'CREATE_APPOINTMENT' | 'CREATE_BUDGET';
    entity_id?: string;
    details: Record<string, any>;
    created_at: string;
}

const STORAGE_KEY = 'assistant_activity_logs';

export function useAssistantActivityLogger() {
    const { user } = useAuth();

    const getLogs = useCallback((): ActivityLog[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }, []);

    const addLog = useCallback((log: Omit<ActivityLog, 'id' | 'created_at'>) => {
        try {
            const logs = getLogs();
            const newLog: ActivityLog = {
                ...log,
                id: crypto.randomUUID(),
                created_at: new Date().toISOString()
            };

            logs.push(newLog);

            // Manter apenas os últimos 500 logs
            const trimmedLogs = logs.slice(-500);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
        } catch (error) {
            console.error('Erro ao salvar log:', error);
        }
    }, [getLogs]);

    const getLogsForAssistant = useCallback((assistantEmail: string): ActivityLog[] => {
        const logs = getLogs();
        return logs.filter(log => log.assistant_email === assistantEmail);
    }, [getLogs]);

    const clearLogs = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        addLog,
        getLogs,
        getLogsForAssistant,
        clearLogs
    };
}
