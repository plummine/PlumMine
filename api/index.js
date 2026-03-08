const axios = require('axios');

const BOT_TOKEN = "8617357036:AAEs-Q1zfl36_6FdL3A8b12XE3TpTksxpKU";
const ADMIN_ID = "7741833062";
const FIREBASE_URL = "https://plumminebot-default-rtdb.firebaseio.com";
const CHANNEL_USERNAME = "@HasiEarnigZone";

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { message } = req.body;
            if (message && message.text) {
                const chatId = message.chat.id.toString();
                const firstName = message.from.first_name || "User";
                const text = message.text;

                if (text.startsWith('/start')) {
                    const startParam = text.split(' ')[1];

                    // ডাটাবেসে ইউজার প্রোফাইল নিশ্চিত করা
                    await axios.patch(`${FIREBASE_URL}/users/${chatId}.json`, {
                        name: firstName
                    });

                    // সার্ভার-সাইড রেফারেল লজিক
                    if (startParam && startParam !== chatId) {
                        const checkRef = await axios.get(`${FIREBASE_URL}/users/${chatId}/is_referred.json`);
                        if (!checkRef.data) {
                            const refPath = `${FIREBASE_URL}/users/${startParam}`;
                            const refResponse = await axios.get(`${refPath}.json`);
                            
                            if (refResponse.data) {
                                // রেফারারের পয়েন্ট ও রেফারাল লিস্ট আপডেট
                                await axios.patch(`${refPath}.json`, {
                                    points: (refResponse.data.points || 0) + 500
                                });
                                await axios.patch(`${refPath}/referrals.json`, {
                                    [chatId]: firstName
                                });
                                // এই ইউজারকে মার্ক করা
                                await axios.put(`${FIREBASE_URL}/users/${chatId}/is_referred.json`, true);
                                
                                // অ্যাডমিন নোটিফিকেশন
                                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                    chat_id: ADMIN_ID,
                                    text: `📢 নতুন সফল রেফারেল!\n👤 ইউজার: ${firstName}\n🆔 আইডি: ${chatId}\n🤝 রেফারার: ${startParam}\n🎁 বোনাস: ৫০০ চেরি।`
                                });
                            }
                        }
                    }

                    const welcomeMsg = `আসসালামু আলাইকুম ${firstName}!\n🧺🍒 PlumMine এ আপনাকে স্বাগতম।\n\nগেমটি খেলার জন্য নিচের বাটনে ক্লিক করুন।`;
                    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        chat_id: chatId,
                        text: welcomeMsg,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "🧺 Play PlumMine", web_app: { url: "https://plum-mine.vercel.app" } }],
                                [{ text: "📢 Join Channel", url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }]
                            ]
                        }
                    });
                }
            }
        } catch (e) { console.error("Error:", e.message); }
        return res.status(200).send('OK');
    }
    return res.status(200).send('PlumMine Active');
};
