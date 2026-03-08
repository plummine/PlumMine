const axios = require('axios');

// আপনার কনফিগারেশন - সব চেক করা হয়েছে
const BOT_TOKEN = "8617357036:AAEs-Q1zfl36_6FdL3A8b12XE3TpTksxpKU";
const ADMIN_ID = "7741833062";
const FIREBASE_URL = "https://plumminebot-default-rtdb.firebaseio.com";
const CHANNEL_USERNAME = "@HasiEarnigZone";
const GAME_URL = "https://plummine.vercel.app"; // আপনার ভার্সেল গেম লিঙ্ক

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { message } = req.body;

            if (message && message.text) {
                const chatId = message.chat.id;
                const text = message.text;
                const firstName = message.from.first_name;

                // ১. স্টার্ট কমান্ড হ্যান্ডলিং
                if (text.startsWith('/start')) {
                    const startParam = text.split(' ')[1]; // রেফারেল আইডি

                    // ওয়েলকাম মেসেজ
                    const welcomeMsg = `আসসালামু আলাইকুম ${firstName}!\n🧺🍒 PlumMine এ আপনাকে স্বাগতম।\n\nগেমটি খেলার জন্য নিচের বাটনে ক্লিক করুন। মনে রাখবেন, চ্যানেলে জয়েন না থাকলে পয়েন্ট সেভ হবে না!`;
                    
                    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        chat_id: chatId,
                        text: welcomeMsg,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "🧺 Play PlumMine", web_app: { url: GAME_URL } }],
                                [{ text: "📢 Join Channel", url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }]
                            ]
                        }
                    });

                    // ২. রেফারেল এবং ডেটাবেস লজিক
                    if (startParam && startParam != chatId) {
                        // চেক করা হচ্ছে নতুন ইউজার কি না
                        const userCheck = await axios.get(`${FIREBASE_URL}/users/${chatId}.json`);
                        
                        if (!userCheck.data) {
                            const refPath = `${FIREBASE_URL}/users/${startParam}`;
                            const refResponse = await axios.get(`${refPath}.json`);
                            
                            if (refResponse.data) {
                                let currentPoints = refResponse.data.points || 0;
                                
                                // রেফারারের পয়েন্ট ৫০০ বৃদ্ধি করা
                                await axios.patch(`${refPath}.json`, {
                                    points: currentPoints + 500
                                });

                                // রেফারেল লিস্টে নাম সেভ করা
                                await axios.put(`${refPath}/referrals/${chatId}.json`, JSON.stringify(firstName));
                                
                                // অ্যাডমিনকে (আপনাকে) জানানো
                                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                    chat_id: ADMIN_ID,
                                    text: `📢 New Referral Alert!\n\n👤 User: ${firstName}\n🆔 ID: ${chatId}\n🤝 Referred By: ${startParam}\n🎁 Bonus: 500 🍒 Added.`
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Bot Error:", error.message);
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Server is running properly!');
};
