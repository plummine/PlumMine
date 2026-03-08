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
                const text = message.text;
                const firstName = message.from.first_name || "User";

                if (text.startsWith('/start')) {
                    const startParam = text.split(' ')[1];

                    // ১. ইউজারের ডাটাবেস এন্ট্রি চেক ও তৈরি
                    const userCheck = await axios.get(`${FIREBASE_URL}/users/${chatId}.json`);
                    if (!userCheck.data) {
                        await axios.put(`${FIREBASE_URL}/users/${chatId}.json`, {
                            name: firstName,
                            points: 0,
                            taps: 0
                        });
                    }

                    // ২. রেফারেল লজিক (সরাসরি ডাটাবেস পাথ অনুযায়ী)
                    if (startParam && startParam !== chatId) {
                        const isReferred = await axios.get(`${FIREBASE_URL}/users/${chatId}/is_referred.json`);
                        
                        if (!isReferred.data) {
                            const refPath = `${FIREBASE_URL}/users/${startParam}`;
                            const refData = await axios.get(`${refPath}.json`);
                            
                            if (refData.data) {
                                let newPoints = (refData.data.points || 0) + 500;
                                
                                // রেফারারের পয়েন্ট আপডেট
                                await axios.patch(`${refPath}.json`, { points: newPoints });

                                // রেফারারের লিস্টে নতুন ইউজারের নাম যোগ
                                await axios.patch(`${refPath}/referrals.json`, { [chatId]: firstName });

                                // ইউজারকে মার্ক করা যাতে বারবার বোনাস না পায়
                                await axios.put(`${FIREBASE_URL}/users/${chatId}/is_referred.json`, true);

                                // অ্যাডমিনকে জানানো
                                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                    chat_id: ADMIN_ID,
                                    text: `📢 সফল রেফার!\n👤 নতুন: ${firstName}\n🤝 রেফারার: ${startParam}\n🎁 বোনাস: ৫০০ চেরি।`
                                });
                            }
                        }
                    }

                    // ৩. রিপ্লাই মেসেজ
                    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        chat_id: chatId,
                        text: `আসসালামু আলাইকুম ${firstName}!\n🧺🍒 PlumMine এ আপনাকে স্বাগতম।`,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "🧺 Play PlumMine", web_app: { url: "https://plum-mine.vercel.app" } }],
                                [{ text: "📢 Join Channel", url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }]
                            ]
                        }
                    });
                }
            }
        } catch (e) { console.error(e.message); }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Active');
};
