import './config.js';

// Extract message content
function getMessageBody(m) {
    const msg = m.messages[0];
    if (!msg.message) return '';
    
    return (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        msg.message.documentMessage?.caption ||
        ''
    );
}

export default async (vynaa, m) => {
    try {
        const body = getMessageBody(m);
        const msg = m.messages[0];

        if (!body) return;

        const command = body.toLowerCase().trim();

        switch(command) {
            case "ping":
                const start = Date.now();
                await vynaa.sendMessage(msg.key.remoteJid, { text: "🏓" });
                const end = Date.now();
                const speed = end - start;
                
                await vynaa.sendMessage(msg.key.remoteJid, { 
                    text: `⏱️ ${speed}ms` 
                });
                break;

            case "help":
            case "menu":
                const helpText = `🤖 *VYNAA BOT MENU* 🤖

⚡ *UTILITY*
• ping - Cek kecepatan bot
• help - Menu ini

━━━━━━━━━━━━━━━━━━
✨ *Vynaa Bot - Simple & Fast*`;
                
                await vynaa.sendMessage(msg.key.remoteJid, { text: helpText });
                break;

            default:
                // Jika command tidak dikenali, tidak melakukan apa-apa
                break;
        }

    } catch (error) {
        // Semua error disembunyikan dari console
    }
};