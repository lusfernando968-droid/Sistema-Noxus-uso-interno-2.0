import { whatsappWebService } from './whatsapp-web.service.js';

export interface WhatsAppMessage {
    from: string;
    body: string;
    fromMe: boolean;
    timestamp: number;
}

export interface SendMessageParams {
    number: string;
    text: string;
}

class WhatsAppService {
    /**
     * Envia mensagem de texto
     */
    async sendText(number: string, text: string): Promise<void> {
        try {
            // whatsapp-web.js já formata o número internamente
            await whatsappWebService.sendText(number, text);
            console.log(`✅ Mensagem enviada para ${number}`);
        } catch (error: any) {
            console.error('❌ Erro ao enviar mensagem:', error.message);
            throw error;
        }
    }

    /**
     * Formata número de telefone
     */
    private formatNumber(number: string): string {
        // Remove caracteres não numéricos
        let cleaned = number.replace(/\D/g, '');

        // Se não tem código do país, adiciona 55 (Brasil)
        if (!cleaned.startsWith('55')) {
            cleaned = '55' + cleaned;
        }

        // Adiciona @s.whatsapp.net se necessário
        if (!cleaned.includes('@')) {
            cleaned = cleaned + '@s.whatsapp.net';
        }

        return cleaned;
    }

    /**
     * Verifica se instância está conectada
     */
    async checkConnection(): Promise<boolean> {
        return whatsappWebService.isConnected();
    }
}

export const whatsappService = new WhatsAppService();
