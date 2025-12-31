import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { config } from './config.js';
// Usando versão simplificada temporariamente (sem IA)
import { messageProcessorSimple as messageProcessor } from './services/message.processor.simple.js';
import { whatsappService } from './services/whatsapp.service.js';
import { whatsappWebService } from './services/whatsapp-web.service.js';


const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'noxus-whatsapp-chatbot',
        whatsappConnected: whatsappWebService.isConnected(),
    });
});

// Endpoint de teste
app.post('/test-message', async (req: Request, res: Response) => {
    try {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({ error: 'number and message are required' });
        }

        await whatsappService.sendText(number, message);

        // Salva mensagem enviada no banco
        try {
            const { supabaseService } = await import('./services/supabase.service.js');
            await supabaseService.logMessage({
                phoneNumber: number,
                direction: 'outbound',
                messageText: message,
            });
        } catch (error) {
            console.error('Erro ao salvar mensagem enviada:', error);
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Inicia servidor
const PORT = config.port;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 Test: http://localhost:${PORT}/test-message`);

    // Inicializa WhatsApp Web.js
    try {
        await whatsappWebService.initialize();

        // Registra handler de mensagens (APENAS PARA LOGGING - SEM RESPOSTAS AUTOMÁTICAS)
        whatsappWebService.onMessage(async (message: any) => {
            console.log(`📥 Mensagem recebida de ${message.from}: ${message.text}`);

            // ⚠️ BOT DESATIVADO - Apenas registra no banco, não responde automaticamente
            // Para reativar o bot, descomente a linha abaixo:
            // messageProcessor.processMessage(message.from, message.text, message.chatId).catch(error => {
            //     console.error('❌ Erro ao processar mensagem:', error);
            // });

            // Salva mensagem no banco para aparecer no dashboard
            try {
                console.log('💾 Tentando salvar mensagem no banco...');
                console.log('   Phone:', message.from);
                console.log('   Text:', message.text);

                const { supabaseService } = await import('./services/supabase.service.js');

                const result = await supabaseService.logMessage({
                    phoneNumber: message.from,
                    direction: 'inbound',
                    messageText: message.text,
                });

                console.log('✅ Mensagem salva no banco com sucesso!', result);
            } catch (error: any) {
                console.error('❌ ERRO AO SALVAR MENSAGEM:');
                console.error('   Mensagem:', error.message);
                console.error('   Stack:', error.stack);
                console.error('   Detalhes completos:', JSON.stringify(error, null, 2));
            }
        });

        console.log('✅ WhatsApp Web.js inicializado com sucesso!');
        console.log('⚠️  BOT AUTOMÁTICO DESATIVADO - Apenas espelho do WhatsApp');
    } catch (error) {
        console.error('❌ Erro ao inicializar WhatsApp Web.js:', error);
    }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});
