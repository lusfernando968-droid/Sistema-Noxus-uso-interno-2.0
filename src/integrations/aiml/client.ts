import axios, { AxiosInstance } from 'axios';

export type AIMLMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

export type AIMLChatRequest = {
    model: string;
    messages: AIMLMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
};

export type AIMLChatResponse = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
};

const API_KEY = import.meta.env.VITE_AIML_API_KEY as string | undefined;
const BASE_URL = 'https://api.aimlapi.com/v1';

if (!API_KEY) {
    console.warn('VITE_AIML_API_KEY is not set. AI/ML API features will be disabled.');
}

class AIMLAPIClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Chat completion using AI/ML API
     * Supports multiple models including GPT, Claude, Llama, etc.
     */
    async chat(request: AIMLChatRequest): Promise<AIMLChatResponse> {
        if (!API_KEY) {
            throw new Error('AI/ML API key is not configured (VITE_AIML_API_KEY)');
        }

        try {
            const response = await this.client.post<AIMLChatResponse>('/chat/completions', request);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.error?.message || error.message;

            if (status === 401) {
                throw new Error('AI/ML API: Chave de API inválida ou expirada');
            } else if (status === 429) {
                throw new Error('AI/ML API: Limite de requisições atingido. Aguarde alguns minutos.');
            } else if (status === 400) {
                throw new Error(`AI/ML API: Requisição inválida - ${message}`);
            } else {
                throw new Error(`AI/ML API: Erro ao processar requisição - ${message}`);
            }
        }
    }

    /**
     * Simple chat helper with default settings
     */
    async simpleChat(
        messages: AIMLMessage[],
        model: string = 'gpt-4o-mini',
        options?: { temperature?: number; max_tokens?: number }
    ): Promise<string> {
        const response = await this.chat({
            model,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.max_tokens ?? 1000,
        });

        return response.choices[0]?.message?.content || '';
    }

    /**
     * Extract entities from natural language text
     * Useful for chatbot message processing
     */
    async extractEntities(text: string, entityTypes: string[]): Promise<Record<string, any>> {
        const systemPrompt = `Você é um assistente especializado em extrair informações estruturadas de texto em português brasileiro.
Extraia as seguintes entidades do texto: ${entityTypes.join(', ')}.
Retorne APENAS um objeto JSON válido com as entidades encontradas.`;

        const response = await this.simpleChat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
        ]);

        try {
            return JSON.parse(response);
        } catch {
            console.warn('Failed to parse AI/ML API response as JSON:', response);
            return {};
        }
    }

    /**
     * Detect user intent from message
     */
    async detectIntent(message: string, possibleIntents: string[]): Promise<string> {
        const systemPrompt = `Você é um assistente que identifica a intenção do usuário.
Possíveis intenções: ${possibleIntents.join(', ')}.
Retorne APENAS o nome da intenção identificada, sem explicações.`;

        const response = await this.simpleChat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
        ]);

        return response.trim();
    }

    /**
     * List available models
     */
    async listModels(): Promise<any> {
        if (!API_KEY) {
            throw new Error('AI/ML API key is not configured');
        }

        try {
            const response = await this.client.get('/models');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to list models: ${error.message}`);
        }
    }
}

// Export singleton instance
export const aimlClient = new AIMLAPIClient();

// Export helper function for easy usage
export async function chatWithAIML(
    messages: AIMLMessage[],
    model?: string
): Promise<string> {
    return aimlClient.simpleChat(messages, model);
}
