import { whatsappWebService } from './services/whatsapp-web.service.js';

// Aguarda o WhatsApp estar pronto
setTimeout(async () => {
    try {
        const client = (whatsappWebService as any).client;

        if (client) {
            const info = await client.info;
            console.log('\n📱 ===== INFORMAÇÕES DO BOT =====');
            console.log('Número:', info.wid.user);
            console.log('Nome:', info.pushname);
            console.log('Plataforma:', info.platform);
            console.log('================================\n');
        } else {
            console.log('❌ Cliente não inicializado ainda');
        }
    } catch (error) {
        console.error('❌ Erro ao buscar informações:', error);
    }
}, 5000); // Aguarda 5 segundos para o WhatsApp conectar
