import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

class SupabaseService {
    public client: SupabaseClient;

    constructor() {
        this.client = createClient(
            config.supabase.url,
            config.supabase.serviceKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );
    }

    /**
     * Busca usuário por telefone
     */
    async getUserByPhone(phone: string) {
        const { data, error } = await this.client
            .rpc('get_user_by_phone', { p_phone: phone });

        if (error) {
            console.error('Erro ao buscar usuário:', error);
            return null;
        }

        return data?.[0] || null;
    }

    /**
     * Cria cliente via chatbot
     */
    async createCliente(userId: string, data: {
        nome: string;
        email: string;
        telefone: string;
        documento?: string;
        endereco?: string;
    }) {
        const { data: result, error } = await this.client
            .rpc('create_cliente_via_chatbot', {
                p_user_id: userId,
                p_nome: data.nome,
                p_email: data.email,
                p_telefone: data.telefone,
                p_documento: data.documento,
                p_endereco: data.endereco,
            });

        if (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }

        return result;
    }

    /**
     * Salva sessão de chatbot
     */
    async saveSession(phoneNumber: string, userId: string | null, state: any) {
        const { data, error } = await this.client
            .from('chatbot_sessions')
            .upsert({
                phone_number: phoneNumber,
                user_id: userId,
                state,
                last_message_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
            }, {
                onConflict: 'phone_number',
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao salvar sessão:', error);
        }

        return data;
    }

    /**
     * Busca sessão ativa
     */
    async getSession(phoneNumber: string) {
        const { data, error } = await this.client
            .from('chatbot_sessions')
            .select('*')
            .eq('phone_number', phoneNumber)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Erro ao buscar sessão:', error);
        }

        return data;
    }

    /**
     * Registra log de mensagem
     */
    async logMessage(data: {
        sessionId?: string;
        phoneNumber: string;
        direction: 'inbound' | 'outbound';
        messageText: string;
        intent?: string;
        entities?: any;
    }) {
        const { data: result, error } = await this.client
            .from('chatbot_logs')
            .insert({
                session_id: data.sessionId,
                phone_number: data.phoneNumber,
                direction: data.direction,
                message_text: data.messageText,
                intent: data.intent,
                entities: data.entities,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Erro ao inserir log de mensagem:', error);
            throw error;
        }

        return result;
    }
}

export const supabaseService = new SupabaseService();
