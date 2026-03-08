const axios = require('axios');

const BOT_TOKEN = "8617357036:AAEs-Q1zfl36_6FdL3A8b12XE3TpTksxpKU";
const ADMIN_ID = "7741833062";
const FIREBASE_URL = "https://plumminebot-default-rtdb.firebaseio.com";
const CHANNEL_LINK = "HasiEarnigZone"; // @ ছাড়া শুধু নাম দিন

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { message } = req.body;
            if (!message || !message.text) return res.status(200).send('No Message');

            const chatId = String(message.chat.id);
            const text = message.text;
            const firstName = message.from.first_name || "User";

            if (text.startsWith('/start')) {
                const startParam = text.split(' ')[1] ? String(text.split(' ')[1]) : null;

                // ১. প্রোফাইল আপডেট
                await axios.patch(`${FIREBASE_URL}/users/${chatId}.json`, { name: firstName }).catch(e => console.log("DB Error"));

                // ২. রেফারেল লজিক
                if (startParam && startParam !== chatId) {
                    try {
                        const checkRef = await axios.get(`${FIREBASE_URL}/users/${chatId}/is_referred.json`);
                        if (!checkRef.data) {
                            const refPath = `${FIREBASE_URL}/users/${startParam}`;
                            const refData = await axios.get(`${refPath}.json`);
                            
                            if (refData.data) {
                                let newPoints = (refData.data.points || 0) + 500;
                                await axios.patch(`${refPath}.json`, { points: newPoints });
                                await axios.patch(`${refPath}/referrals.json`, { [chatId]: firstName });
                                await axios.put(`${FIREBASE_URL}/users/${chatId}/is_referred.json`, true);
                                
                                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                    chat_id: ADMIN_ID,
                                    text: `📢 সফল রেফারেল!\n👤 ইউজার: ${firstName}\n🤝 রেফারার আইডি: ${startParam}`
                                }).catch(e => console.log("Admin Msg Fail"));
                            }
                        }
                    } catch (err) { console.log("Referral logic failed"); }
                }

                // ৩. ওয়েলকাম মেসেজ (URL হার্ডকোড করা হয়েছে ভুল এড়াতে)
                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: `আসসালামু আলাইকুম ${firstName}!\nPlumMine এ স্বাগতম।`,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🧺 Play PlumMine", web_app: { url: "https://plum-mine.vercel.app" } }],
                            [{ text: "📢 Join Channel", url: `https://t.me/${CHANNEL_LINK}` }]
                        ]
                    }
                });
            }
        } catch (error) {
            console.error("Critical Error:", error.message);
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('PlumMine Active');
};
