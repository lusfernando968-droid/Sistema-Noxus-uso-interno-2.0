import { aimlService } from '../services/aiml.service.js';
import { supabaseService } from '../services/supabase.service.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { handleCreateCliente } from '../handlers/cliente.handler.js';

export interface ConversationState {
    intent?: string;
    entities?: Record<string, any>;
    step?: string;
    awaitingConfirmation?: boolean;
}

export class MessageProcessor {
    /**
     * Processa mensagem recebida
     */
    async processMessage(from: string, message: string): Promise<void> {
        console.log(`📨 Processando mensagem de ${from}: ${message}`);

        try {
            // Busca sessão existente
            const session = await supabaseService.getSession(from);
            const state: ConversationState = session?.state || {};

            // Log da mensagem recebida
            await supabaseService.logMessage({
                sessionId: session?.id,
                phoneNumber: from,
                direction: 'inbound',
                messageText: message,
            });

            // Se está aguardando confirmação
            if (state.awaitingConfirmation) {
                await this.handleConfirmation(from, message, state, session?.user_id);
                return;
            }

            // Detecta intenção
            const intent = await aimlService.detectIntent(message);
            console.log(`🎯 Intenção detectada: ${intent}`);

            // Processa baseado na intenção
            switch (intent) {
                case 'criar_cliente':
                    await this.handleCreateClienteIntent(from, message, session?.user_id);
                    break;

                case 'criar_agendamento':
                    await whatsappService.sendText(
                        from,
                        '📅 Funcionalidade de agendamento em desenvolvimento! Em breve você poderá agendar sessões por aqui.'
                    );
                    break;

                case 'criar_projeto':
                    await whatsappService.sendText(
                        from,
                        '📋 Funcionalidade de projetos em desenvolvimento! Em breve você poderá criar projetos por aqui.'
                    );
                    break;

                case 'saudacao':
                    await this.handleGreeting(from);
                    break;

                case 'ajuda':
                    await this.handleHelp(from);
                    break;

                default:
                    await this.handleUnknown(from);
            }
        } catch (error: any) {
            console.error('❌ Erro ao processar mensagem:', error);
            await whatsappService.sendText(
                from,
                '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
            );
        }
    }

    /**
     * Processa intenção de criar cliente
     */
    private async handleCreateClienteIntent(from: string, message: string, userId?: string) {
        // Verifica se usuário está autenticado
        if (!userId) {
            const user = await supabaseService.getUserByPhone(from);
            if (!user) {
                await whatsappService.sendText(
                    from,
                    '🔐 Para cadastrar clientes, você precisa vincular seu número de telefone ao sistema.\n\nPor favor, acesse o sistema web e vincule seu telefone na página de perfil.'
                );
                return;
            }
            userId = user.user_id;
        }

        // Extrai entidades
        const entities = await aimlService.extractEntities(message, [
            'nome',
            'email',
            'telefone',
            'documento',
            'endereco',
        ]);

        console.log('📋 Entidades extraídas:', entities);

        // Verifica se tem dados mínimos
        if (!entities.nome || !entities.email || !entities.telefone) {
            await whatsappService.sendText(
                from,
                '📝 Para cadastrar um cliente, preciso de:\n\n' +
                '• Nome completo\n' +
                '• Email\n' +
                '• Telefone\n\n' +
                'Exemplo: "Cadastrar cliente Maria Santos, email maria@email.com, telefone (11) 98765-4321"'
            );
            return;
        }

        // Gera mensagem de confirmação
        const confirmation = await aimlService.generateConfirmation('criar_cliente', entities);

        // Salva estado
        await supabaseService.saveSession(from, userId, {
            intent: 'criar_cliente',
            entities,
            awaitingConfirmation: true,
        });

        // Envia confirmação
        await whatsappService.sendText(from, confirmation);
    }

    /**
     * Processa confirmação do usuário
     */
    private async handleConfirmation(
        from: string,
        message: string,
        state: ConversationState,
        userId?: string
    ) {
        const response = message.toLowerCase().trim();

        if (response === 'sim' || response === 's') {
            // Confirma ação
            if (state.intent === 'criar_cliente') {
                await handleCreateCliente(from, state.entities!, userId!);
            }
        } else if (response === 'não' || response === 'nao' || response === 'n') {
            // Cancela ação
            await whatsappService.sendText(from, '❌ Operação cancelada.');
            await supabaseService.saveSession(from, userId || null, {});
        } else {
            // Não entendeu
            await whatsappService.sendText(
                from,
                '🤔 Não entendi. Responda "Sim" para confirmar ou "Não" para cancelar.'
            );
        }
    }

    /**
     * Saudação
     */
    private async handleGreeting(from: string) {
        await whatsappService.sendText(
            from,
            '👋 Olá! Sou o assistente virtual da Noxus.\n\n' +
            'Posso ajudá-lo a:\n' +
            '• Cadastrar clientes\n' +
            '• Agendar sessões (em breve)\n' +
            '• Criar projetos (em breve)\n\n' +
            'Como posso ajudar?'
        );
    }

    /**
     * Ajuda
     */
    private async handleHelp(from: string) {
        await whatsappService.sendText(
            from,
            '❓ *Comandos disponíveis:*\n\n' +
            '*Cadastrar cliente:*\n' +
            'Exemplo: "Cadastrar cliente João Silva, email joao@email.com, telefone (11) 99999-9999"\n\n' +
            '*Em breve:*\n' +
            '• Agendar sessões\n' +
            '• Criar projetos\n' +
            '• Consultar informações'
        );
    }

    /**
     * Intenção desconhecida
     */
    private async handleUnknown(from: string) {
        await whatsappService.sendText(
            from,
            '🤔 Desculpe, não entendi. Digite "ajuda" para ver os comandos disponíveis.'
        );
    }
}

export const messageProcessor = new MessageProcessor();
