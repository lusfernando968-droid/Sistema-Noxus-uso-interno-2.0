import { whatsappService } from '../services/whatsapp.service.js';
import { supabaseService } from '../services/supabase.service.js';

export interface ConversationState {
    intent?: string;
    entities?: Record<string, any>;
    step?: string;
    awaitingConfirmation?: boolean;
}

export class MessageProcessorSimple {
    /**
     * Processa mensagem recebida (versão simplificada sem IA)
     */
    async processMessage(from: string, message: string, chatId?: string): Promise<void> {
        console.log(`📨 Processando mensagem de ${from}: ${message}`);

        try {
            // Verifica se o usuário está cadastrado (mas não bloqueia)
            const user = await supabaseService.getUserByPhone(from);
            const isRegistered = !!user;

            console.log(`👤 Usuário ${isRegistered ? 'cadastrado' : 'não cadastrado'}: ${from}`);

            // Log da mensagem recebida
            await supabaseService.logMessage({
                phoneNumber: from,
                direction: 'inbound',
                messageText: message,
            });

            const lowerMessage = message.toLowerCase().trim();

            // Detecta intenção por palavras-chave
            if (lowerMessage.includes('cadastrar') || lowerMessage.includes('adicionar') || lowerMessage.includes('criar')) {
                if (lowerMessage.includes('cliente')) {
                    await this.handleCreateCliente(chatId || from, message, user?.user_id, isRegistered);
                    return;
                }
            }

            if (lowerMessage.includes('ajuda') || lowerMessage.includes('help')) {
                await this.handleHelp(chatId || from, isRegistered);
                return;
            }

            if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('ola') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
                await this.handleGreeting(chatId || from, isRegistered);
                return;
            }

            // Mensagem não reconhecida
            const response = '🤔 Desculpe, não entendi. Digite "ajuda" para ver os comandos disponíveis.';
            await whatsappService.sendText(chatId || from, response);

            // Log da resposta
            await supabaseService.logMessage({
                phoneNumber: from,
                direction: 'outbound',
                messageText: response,
            });
        } catch (error: any) {
            console.error('❌ Erro ao processar mensagem:', error);
            const errorResponse = '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
            await whatsappService.sendText(chatId || from, errorResponse);

            // Log do erro
            await supabaseService.logMessage({
                phoneNumber: from,
                direction: 'outbound',
                messageText: errorResponse,
            });
        }
    }

    /**
     * Processa criação de cliente (simplificado)
     */
    private async handleCreateCliente(from: string, message: string, userId?: string, isRegistered: boolean = false) {
        // Verifica se o usuário está cadastrado
        if (!isRegistered || !userId) {
            const response = '🔐 *Número não cadastrado*\n\n' +
                'Para cadastrar clientes e usar funcionalidades avançadas, você precisa vincular seu número de telefone ao sistema.\n\n' +
                '📱 *Como vincular:*\n' +
                '1. Acesse o sistema web da Noxus\n' +
                '2. Vá em Perfil/Configurações\n' +
                '3. Adicione e verifique seu número de telefone\n\n' +
                '💡 Enquanto isso, você pode usar:\n' +
                '• Saudações e ajuda\n' +
                '• Informações gerais\n\n' +
                'Digite "ajuda" para ver mais opções.';

            await whatsappService.sendText(from, response);
            await supabaseService.logMessage({
                phoneNumber: from,
                direction: 'outbound',
                messageText: response,
                intent: 'criar_cliente_bloqueado',
            });
            return;
        }

        // Extrai dados usando regex simples
        const nomeMatch = message.match(/(?:cliente|nome)[:\s]+([^,]+)/i);
        const emailMatch = message.match(/(?:email|e-mail)[:\s]+([^\s,]+)/i);
        const telefoneMatch = message.match(/(?:telefone|tel|fone)[:\s]+([0-9\(\)\s\-]+)/i);

        const nome = nomeMatch?.[1]?.trim();
        const email = emailMatch?.[1]?.trim();
        const telefone = telefoneMatch?.[1]?.trim();

        if (!nome || !email || !telefone) {
            const response = '📝 Para cadastrar um cliente, preciso de:\\n\\n' +
                '• Nome completo\\n' +
                '• Email\\n' +
                '• Telefone\\n\\n' +
                'Exemplo: \"Cadastrar cliente Maria Santos, email maria@email.com, telefone (11) 98765-4321\"';

            await whatsappService.sendText(from, response);
            await supabaseService.logMessage({
                phoneNumber: from,
                direction: 'outbound',
                messageText: response,
                intent: 'criar_cliente',
            });
            return;
        }

        // Envia confirmação
        const response = `✅ *Cliente cadastrado com sucesso!*\\n\\n` +
            `📋 *Dados:*\\n` +
            `• Nome: ${nome}\\n` +
            `• Email: ${email}\\n` +
            `• Telefone: ${telefone}\\n\\n` +
            `_Nota: Esta é uma versão simplificada do bot. O cadastro real será implementado em breve._`;

        await whatsappService.sendText(from, response);
        await supabaseService.logMessage({
            phoneNumber: from,
            direction: 'outbound',
            messageText: response,
            intent: 'criar_cliente',
            entities: { nome, email, telefone },
        });
    }

    /**
     * Saudação
     */
    private async handleGreeting(from: string, isRegistered: boolean = false) {
        let response = '👋 Olá! Sou o assistente virtual da Noxus.\n\n';

        if (isRegistered) {
            response += 'Posso ajudá-lo a:\n' +
                '• Cadastrar clientes\n' +
                '• Agendar sessões (em breve)\n' +
                '• Criar projetos (em breve)\n\n' +
                'Como posso ajudar?';
        } else {
            response += '⚠️ *Seu número não está cadastrado no sistema.*\n\n' +
                'Para usar funcionalidades avançadas, vincule seu telefone no sistema web.\n\n' +
                '💬 Por enquanto, posso:\n' +
                '• Responder suas dúvidas\n' +
                '• Fornecer informações gerais\n\n' +
                'Digite "ajuda" para mais informações.';
        }

        await whatsappService.sendText(from, response);
        await supabaseService.logMessage({
            phoneNumber: from,
            direction: 'outbound',
            messageText: response,
            intent: 'saudacao',
        });
    }

    /**
     * Ajuda
     */
    private async handleHelp(from: string, isRegistered: boolean = false) {
        let response = '❓ *Comandos disponíveis:*\n\n';

        if (isRegistered) {
            response += '*Cadastrar cliente:*\n' +
                'Exemplo: "Cadastrar cliente João Silva, email joao@email.com, telefone (11) 99999-9999"\n\n' +
                '*Em breve:*\n' +
                '• Agendar sessões\n' +
                '• Criar projetos\n' +
                '• Consultar informações';
        } else {
            response += '⚠️ *Número não cadastrado*\n\n' +
                'Para usar funcionalidades avançadas como cadastrar clientes, você precisa:\n\n' +
                '1. Acessar o sistema web da Noxus\n' +
                '2. Ir em Perfil/Configurações\n' +
                '3. Adicionar e verificar seu número\n\n' +
                '💬 *Disponível agora:*\n' +
                '• Saudações\n' +
                '• Informações gerais';
        }

        await whatsappService.sendText(from, response);
        await supabaseService.logMessage({
            phoneNumber: from,
            direction: 'outbound',
            messageText: response,
            intent: 'ajuda',
        });
    }
}

export const messageProcessorSimple = new MessageProcessorSimple();
