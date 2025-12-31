import { aimlClient, chatWithAIML } from './client';

/**
 * Example: Simple chat with AI/ML API
 */
export async function exampleSimpleChat() {
    const response = await chatWithAIML([
        {
            role: 'system',
            content: 'Você é um assistente útil que responde em português brasileiro.',
        },
        {
            role: 'user',
            content: 'Olá! Como você pode me ajudar?',
        },
    ]);

    console.log('AI Response:', response);
    return response;
}

/**
 * Example: Extract client information from natural language
 */
export async function exampleExtractClientInfo(message: string) {
    const entities = await aimlClient.extractEntities(message, [
        'nome',
        'email',
        'telefone',
        'endereco',
    ]);

    console.log('Extracted entities:', entities);
    return entities;
}

/**
 * Example: Detect user intent for chatbot
 */
export async function exampleDetectIntent(message: string) {
    const intent = await aimlClient.detectIntent(message, [
        'criar_cliente',
        'criar_agendamento',
        'criar_projeto',
        'consultar_informacoes',
        'cancelar_agendamento',
        'atualizar_dados',
    ]);

    console.log('Detected intent:', intent);
    return intent;
}

/**
 * Example: Process WhatsApp message for chatbot
 */
export async function processWhatsAppMessage(message: string) {
    // Step 1: Detect intent
    const intent = await aimlClient.detectIntent(message, [
        'criar_cliente',
        'criar_agendamento',
        'criar_projeto',
        'consultar_informacoes',
    ]);

    console.log('Intent:', intent);

    // Step 2: Extract entities based on intent
    let entities = {};

    if (intent === 'criar_cliente') {
        entities = await aimlClient.extractEntities(message, [
            'nome',
            'email',
            'telefone',
            'documento',
            'endereco',
        ]);
    } else if (intent === 'criar_agendamento') {
        entities = await aimlClient.extractEntities(message, [
            'cliente_nome',
            'titulo',
            'data',
            'hora',
            'descricao',
        ]);
    } else if (intent === 'criar_projeto') {
        entities = await aimlClient.extractEntities(message, [
            'cliente_nome',
            'titulo',
            'descricao',
            'status',
        ]);
    }

    return {
        intent,
        entities,
    };
}

/**
 * Example: Generate confirmation message
 */
export async function generateConfirmationMessage(
    intent: string,
    entities: Record<string, any>
) {
    const response = await chatWithAIML([
        {
            role: 'system',
            content: `Você é um assistente de chatbot WhatsApp. 
Gere uma mensagem de confirmação amigável em português brasileiro para o usuário.
A mensagem deve listar os dados extraídos e pedir confirmação.
Use emojis apropriados e seja conciso.`,
        },
        {
            role: 'user',
            content: `Intenção: ${intent}\nDados extraídos: ${JSON.stringify(entities, null, 2)}`,
        },
    ]);

    return response;
}
