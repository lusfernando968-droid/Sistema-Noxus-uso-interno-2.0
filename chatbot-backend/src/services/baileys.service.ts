import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BaileysMessage {
    from: string;
    text: string;
    timestamp: number;
}

class BaileysService {
    private sock: WASocket | null = null;
    private qrCode: string | null = null;
    private isReady: boolean = false;
    private authDir: string;
    private messageHandlers: ((message: BaileysMessage) => void)[] = [];

    constructor() {
        // Diretório para armazenar credenciais
        this.authDir = path.join(__dirname, '../../auth_info_baileys');
    }

    /**
     * Inicializa conexão com WhatsApp
     */
    async initialize(): Promise<void> {
        try {
            console.log('🔄 Inicializando Baileys...');

            // Carrega ou cria estado de autenticação
            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

            // Cria socket WhatsApp
            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false, // Vamos gerar nosso próprio QR
                logger: pino({ level: 'silent' }), // Desabilita logs verbosos
                browser: ['Noxus Sistema', 'Chrome', '10.0'],
            });

            // Handler de atualização de conexão
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                // Exibe QR Code
                if (qr) {
                    console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
                    qrcode.generate(qr, { small: true });
                    this.qrCode = qr;
                }

                // Verifica status da conexão
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

                    console.log('❌ Conexão fechada. Reconectando:', shouldReconnect);

                    if (shouldReconnect) {
                        // Reconecta automaticamente
                        setTimeout(() => this.initialize(), 3000);
                    } else {
                        console.log('⚠️  Deslogado do WhatsApp. Escaneie o QR Code novamente.');
                        this.isReady = false;
                    }
                } else if (connection === 'open') {
                    console.log('✅ WhatsApp conectado com sucesso!');
                    this.isReady = true;
                    this.qrCode = null;
                }
            });

            // Handler de atualização de credenciais
            this.sock.ev.on('creds.update', saveCreds);

            // Handler de mensagens
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                console.log(`🔔 Evento messages.upsert recebido! Type: ${type}, Mensagens: ${messages.length}`);

                // Aceita tanto 'notify' quanto 'append' (mensagens próprias aparecem como append)
                if (type !== 'notify' && type !== 'append') {
                    console.log(`⏭️  Ignorando tipo: ${type}`);
                    return;
                }

                for (const msg of messages) {
                    console.log(`📨 Processando mensagem:`, {
                        fromMe: msg.key.fromMe,
                        remoteJid: msg.key.remoteJid,
                        participant: msg.key.participant,
                        hasMessage: !!msg.message
                    });

                    // Ignora mensagens próprias (do bot)
                    if (msg.key.fromMe) {
                        console.log(`⏭️  Ignorando mensagem própria`);
                        continue;
                    }

                    // Ignora broadcasts e status (verifica pelo JID)
                    const jid = msg.key.remoteJid;
                    if (!jid || jid === 'status@broadcast' || jid.includes('broadcast')) {
                        console.log(`⏭️  Ignorando broadcast/status: ${jid}`);
                        continue;
                    }

                    // Ignora mensagens de grupos
                    if (jid.endsWith('@g.us')) {
                        console.log(`⏭️  Ignorando grupo: ${jid}`);
                        continue;
                    }

                    // Para newsletters/listas, tenta usar o participant se disponível
                    let senderJid = jid;
                    if (jid.endsWith('@lid') || jid.endsWith('@newsletter')) {
                        if (msg.key.participant) {
                            senderJid = msg.key.participant;
                            console.log(`📧 Mensagem de newsletter/lista. Remetente real: ${senderJid}`);
                        } else {
                            // Se não tem participant, usa o próprio JID da newsletter
                            console.log(`📧 Newsletter sem participant. Usando JID da newsletter: ${jid}`);
                            senderJid = jid;
                        }
                    }

                    // Extrai texto da mensagem
                    const text = msg.message?.conversation ||
                        msg.message?.extendedTextMessage?.text ||
                        '';

                    console.log(`📝 Texto extraído: "${text}"`);

                    if (!text) {
                        console.log(`⏭️  Mensagem sem texto, ignorando`);
                        continue;
                    }

                    // Cria objeto de mensagem usando o remetente real
                    const baileysMessage: BaileysMessage = {
                        from: senderJid,
                        text: text,
                        timestamp: msg.messageTimestamp as number,
                    };

                    console.log(`✅ Notificando handlers com mensagem de ${senderJid}`);

                    // Notifica handlers registrados
                    this.notifyMessageHandlers(baileysMessage);
                }
            });

            console.log('✅ Baileys inicializado. Aguardando conexão...');
        } catch (error) {
            console.error('❌ Erro ao inicializar Baileys:', error);
            throw error;
        }
    }

    /**
     * Registra handler para processar mensagens recebidas
     */
    onMessage(handler: (message: BaileysMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    /**
     * Notifica todos os handlers registrados
     */
    private notifyMessageHandlers(message: BaileysMessage): void {
        for (const handler of this.messageHandlers) {
            try {
                handler(message);
            } catch (error) {
                console.error('❌ Erro no handler de mensagem:', error);
            }
        }
    }

    /**
     * Envia mensagem de texto
     */
    async sendTextMessage(to: string, text: string): Promise<void> {
        if (!this.sock || !this.isReady) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            await this.sock.sendMessage(to, { text });
            console.log(`✅ Mensagem enviada para ${to}`);
        } catch (error) {
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
     * Retorna QR Code atual (se houver)
     */
    getQRCode(): string | null {
        return this.qrCode;
    }

    /**
     * Desconecta do WhatsApp
     */
    async disconnect(): Promise<void> {
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
            this.isReady = false;
            console.log('👋 Desconectado do WhatsApp');
        }
    }
}

export const baileysService = new BaileysService();
