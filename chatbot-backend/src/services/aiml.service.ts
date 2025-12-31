import axios, { AxiosInstance } from 'axios';
import { config } from '../config.js';

export interface AIMLMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

class AIMLService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: config.aiml.baseUrl,
            headers: {
                'Authorization': `Bearer ${config.aiml.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Chat com AI
     */
    async chat(messages: AIMLMessage[], model: string = 'gpt-4o-mini'): Promise<string> {
        try {
            const response = await this.client.post('/chat/completions', {
                model,
                messages,
                temperature: 0.7,
                max_tokens: 1000,
            });

            return response.data.choices[0]?.message?.content || '';
        } catch (error: any) {
            console.error('❌ Erro na AI/ML API:', error.response?.data || error.message);
            throw new Error('Falha ao processar com IA');
        }
    }

    /**
     * Detecta intenção do usuário
     */
    async detectIntent(message: string): Promise<string> {
        const systemPrompt = `Você é um assistente que identifica a intenção do usuário em português brasileiro.
Possíveis intenções:
- criar_cliente: usuário quer cadastrar um novo cliente
- criar_agendamento: usuário quer agendar uma sessão
- criar_projeto: usuário quer criar um projeto
- consultar_info: usuário quer consultar informações
- ajuda: usuário precisa de ajuda ou não entendeu
- saudacao: usuário está cumprimentando

Retorne APENAS o nome da intenção, sem explicações.`;

        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
        ]);

        return response.trim().toLowerCase();
    }

    /**
     * Extrai entidades de texto
     */
    async extractEntities(text: string, entityTypes: string[]): Promise<Record<string, any>> {
        const systemPrompt = `Você é um assistente que extrai informações de texto em português brasileiro.
Extraia as seguintes informações: ${entityTypes.join(', ')}.
Retorne APENAS um objeto JSON válido com as informações encontradas.
Se alguma informação não for encontrada, não inclua no JSON.`;

        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
        ]);

        try {
            // Remove markdown code blocks se existirem
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch {
            console.warn('Falha ao parsear JSON da IA:', response);
            return {};
        }
    }

    /**
     * Gera mensagem de confirmação
     */
    async generateConfirmation(intent: string, entities: Record<string, any>): Promise<string> {
        const systemPrompt = `Você é um assistente de chatbot WhatsApp amigável.
Gere uma mensagem de confirmação em português brasileiro para o usuário.
Use emojis apropriados e seja conciso.
Liste os dados extraídos e peça confirmação com "Responda 'Sim' para confirmar ou 'Não' para cancelar."`;

        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Intenção: ${intent}\nDados: ${JSON.stringify(entities, null, 2)}` },
        ]);

        return response;
    }
}

export const aimlService = new AIMLService();
