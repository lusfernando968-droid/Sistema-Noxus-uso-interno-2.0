import { supabaseService } from '../services/supabase.service.js';
import { whatsappService } from '../services/whatsapp.service.js';

/**
 * Handler para criar cliente
 */
export async function handleCreateCliente(
    from: string,
    entities: Record<string, any>,
    userId: string
): Promise<void> {
    try {
        console.log('👤 Criando cliente:', entities);

        // Cria cliente no Supabase
        const clienteId = await supabaseService.createCliente(userId, {
            nome: entities.nome,
            email: entities.email,
            telefone: entities.telefone,
            documento: entities.documento,
            endereco: entities.endereco,
        });

        // Envia confirmação
        await whatsappService.sendText(
            from,
            `✅ Cliente cadastrado com sucesso!\n\n` +
            `👤 *${entities.nome}*\n` +
            `📧 ${entities.email}\n` +
            `📱 ${entities.telefone}\n\n` +
            `ID: ${clienteId}`
        );

        // Limpa sessão
        await supabaseService.saveSession(from, userId, {});

        // Log
        await supabaseService.logMessage({
            phoneNumber: from,
            direction: 'outbound',
            messageText: 'Cliente criado com sucesso',
            intent: 'criar_cliente',
            entities,
        });

    } catch (error: any) {
        console.error('❌ Erro ao criar cliente:', error);

        await whatsappService.sendText(
            from,
            '❌ Erro ao cadastrar cliente. Por favor, verifique os dados e tente novamente.'
        );
    }
}
