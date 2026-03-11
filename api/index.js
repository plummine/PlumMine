const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { message } = req.body;
        if (!message) return res.status(200).send('OK');

        const chatId = message.chat.id;
        const text = message.text;
        const firstName = message.from.first_name;

        // Environment Variables (Vercel Settings থেকে সেট করবেন)
        const botToken = process.env.BOT_TOKEN;
        const webAppUrl = process.env.WEB_APP_URL;

        if (text === '/start') {
            const welcomeMsg = `হ্যালো ${firstName}! 🧺🍒\nPlumMine মাইনিংয়ে আপনাকে স্বাগতম। ল্যাগ-ফ্রি মাইনিং করতে নিচের বাটনে ক্লিক করুন!`;
            
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: welcomeMsg,
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "🚀 মাইনিং শুরু করুন", web_app: { url: webAppUrl } }
                        ]]
                    }
                })
            });
        }
        res.status(200).send('OK');
    } else {
        res.status(200).send('PlumMine API is Running smoothly...');
    }
};
