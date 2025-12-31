import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

type MessageHandler = (message: { from: string; text: string }) => void | Promise<void>;

class WhatsAppWebService {
    private client: any | null = null;
    private messageHandlers: MessageHandler[] = [];
    private isReady = false;

    /**
     * Inicializa o cliente WhatsApp Web
     */
    async initialize(): Promise<void> {
        console.log('🔄 Inicializando WhatsApp Web.js...');

        // Cria cliente com autenticação local
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './wwebjs_auth',
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            },
        });

        // Handler de QR Code
        this.client.on('qr', (qr: string) => {
            console.log('📱 QR Code recebido. Escaneie com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        // Handler de autenticação
        this.client.on('authenticated', () => {
            console.log('✅ Autenticado com sucesso!');
        });

        // Handler de pronto
        this.client.on('ready', async () => {
            console.log('✅ WhatsApp Web conectado e pronto!');
            this.isReady = true;

            // Mostra informações do bot
            try {
                const info = await this.client.info;
                console.log('\n📱 ===== NÚMERO DO BOT =====');
                console.log(`Número: ${info.wid.user}`);
                console.log(`Nome: ${info.pushname || 'Não definido'}`);
                console.log('===========================\n');
            } catch (error) {
                console.error('Erro ao buscar info do bot:', error);
            }
        });

        // Handler de mensagens
        this.client.on('message', async (msg: any) => {
            try {
                // Ignora mensagens de grupos e status
                if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') {
                    return;
                }

                // Ignora mensagens enviadas por nós
                if (msg.fromMe) {
                    return;
                }

                // Extrai número de telefone do formato @lid ou @c.us
                let phoneNumber = msg.from;
                if (msg.from.includes('@lid')) {
                    // Para @lid, extrai apenas os dígitos
                    phoneNumber = msg.from.split('@')[0];
                } else if (msg.from.includes('@c.us')) {
                    phoneNumber = msg.from.replace('@c.us', '');
                }

                const messageData = {
                    from: phoneNumber,
                    text: msg.body,
                    chatId: msg.from, // Mantém o ID original para responder
                };

                console.log(`📥 Mensagem recebida de ${messageData.from}: ${messageData.text}`);

                // Chama todos os handlers registrados
                for (const handler of this.messageHandlers) {
                    await handler(messageData);
                }
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error);
            }
        });

        // Handler de desconexão
        this.client.on('disconnected', (reason: string) => {
            console.log('⚠️ WhatsApp desconectado:', reason);
            this.isReady = false;
        });

        // Inicializa o cliente
        await this.client.initialize();
    }

    /**
     * Registra um handler para mensagens recebidas
     */
    onMessage(handler: MessageHandler): void {
        this.messageHandlers.push(handler);
    }

    /**
     * Envia mensagem de texto
     */
    async sendText(to: string, text: string): Promise<void> {
        if (!this.client || !this.isReady) {
            throw new Error('Cliente WhatsApp não está pronto');
        }

        try {
            // Formata número para formato do WhatsApp Web.js
            const chatId = this.formatToChatId(to);

            await this.client.sendMessage(chatId, text);
            console.log(`📤 Mensagem enviada para ${to}`);
        } catch (error: any) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    /**
     * Verifica se está conectado
     */
    isConnected(): boolean {
        return this.isReady;
    }

    /**
     * Formata número de telefone do formato WhatsApp Web.js para formato limpo
     * De: 5511999999999@c.us
     * Para: 5511999999999
     */
    private formatPhoneNumber(whatsappId: string): string {
        return whatsappId.replace('@c.us', '');
    }

    /**
     * Formata número de telefone para formato WhatsApp Web.js
     * De: 5511999999999
     * Para: 5511999999999@c.us
     */
    private formatToChatId(phoneNumber: string): string {
        // Remove caracteres não numéricos
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        // Adiciona @c.us se não tiver
        if (!cleanNumber.includes('@')) {
            return `${cleanNumber}@c.us`;
        }

        return cleanNumber;
    }

    /**
     * Desconecta e limpa recursos
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.destroy();
            this.client = null;
            this.isReady = false;
            console.log('👋 WhatsApp desconectado');
        }
    }
}

export const whatsappWebService = new WhatsAppWebService();
