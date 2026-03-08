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
                const chatId = message.chat.id.toString(); // আইডি স্ট্রিং হিসেবে নিশ্চিত করা
                const text = message.text;
                const firstName = message.from.first_name || "User";

                if (text.startsWith('/start')) {
                    // ১. রেফারেল আইডি আলাদা করা
                    const parts = text.split(' ');
                    const startParam = parts.length > 1 ? parts[1].toString() : null;

                    // ২. ইউজারের প্রোফাইল তৈরি (এটি সবসময় হবে)
                    await axios.patch(`${FIREBASE_URL}/users/${chatId}.json`, { name: firstName });

                    // ৩. রেফারেল লজিক (শুধুমাত্র যদি রেফারেল আইডি থাকে এবং তা নিজের না হয়)
                    if (startParam && startParam !== chatId) {
                        const isReferredResponse = await axios.get(`${FIREBASE_URL}/users/${chatId}/is_referred.json`);
                        
                        if (!isReferredResponse.data) {
                            const refPath = `${FIREBASE_URL}/users/${startParam}`;
                            const refUser = await axios.get(`${refPath}.json`);
                            
                            if (refUser.data) {
                                // রেফারারের পয়েন্ট বাড়ানো
                                await axios.patch(`${refPath}.json`, { 
                                    points: (refUser.data.points || 0) + 500 
                                });
                                // রেফারারের লিস্টে নাম যোগ করা
                                await axios.patch(`${refPath}/referrals.json`, { 
                                    [chatId]: firstName 
                                });
                                // ইউজারকে মার্ক করা
                                await axios.put(`${FIREBASE_URL}/users/${chatId}/is_referred.json`, true);
                                
                                // এডমিনকে মেসেজ পাঠানো (এটি না আসলে বুঝবেন লজিক কাজ করেনি)
                                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                    chat_id: ADMIN_ID,
                                    text: `📢 নতুন সফল রেফারেল!\n👤 ইউজার: ${firstName}\n🆔 আইডি: ${chatId}\n🤝 রেফারার: ${startParam}\n🎁 বোনাস: ৫০০ চেরি।`
                                });
                            }
                        }
                    }

                    // ৪. ওয়েলকাম মেসেজ
                    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        chat_id: chatId,
                        text: `আসসালামু আলাইকুম ${firstName}!\n🧺🍒 PlumMine এ স্বাগতম।`,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "🧺 Play PlumMine", web_app: { url: "https://plum-mine.vercel.app" } }],
                                [{ text: "📢 Join Channel", url: `https://t.me/HasiEarnigZone` }]
                            ]
                        }
                    });
                }
            }
        } catch (e) { console.error("Error:", e.message); }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Active');
};
