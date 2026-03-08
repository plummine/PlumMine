const axios = require('axios');

// আপনার কনফিগারেশন
const BOT_TOKEN = "8617357036:AAEs-Q1zfl36_6FdL3A8b12XE3TpTksxpKU";
const ADMIN_ID = "7741833062";
const FIREBASE_URL = "https://plumminebot-default-rtdb.firebaseio.com";
const CHANNEL_USERNAME = "@HasiEarnigZone";

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { message } = req.body;
            if (message && message.text) {
                // chatId এবং startParam-কে স্ট্রিং-এ রূপান্তর নিশ্চিত করা (গুরুত্বপূর্ণ)
                const chatId = String(message.chat.id);
                const text = message.text;
                const firstName = message.from.first_name || "User";

                if (text.startsWith('/start')) {
                    const parts = text.split(' ');
                    const startParam = parts.length > 1 ? String(parts[1]) : null;

                    // ১. ইউজারের বেসিক প্রোফাইল তৈরি (patch ব্যবহার করা হয়েছে যাতে ডাটা না মুছে যায়)
                    await axios.patch(`${FIREBASE_URL}/users/${chatId}.json`, { 
                        name: firstName 
                    });

                    // ২. রেফারেল লজিক
                    if (startParam && startParam !== chatId) {
                        // চেক করা হচ্ছে এই ইউজার আগে কখনো রেফার হয়েছে কি না
                        const checkRef = await axios.get(`${FIREBASE_URL}/users/${chatId}/is_referred.json`);
                        
                        if (!checkRef.data) {
                            const refPath = `${FIREBASE_URL}/users/${startParam}`;
                            const refResponse = await axios.get(`${refPath}.json`);
                            
                            if (refResponse.data) {
                                // রেফারারের পয়েন্ট ৫০০ বৃদ্ধি করা
                                let newPoints = (refResponse.data.points || 0) + 500;
                                await axios.patch(`${refPath}.json`, { points: newPoints });

                                // রেফারারের 'referrals' লিস্টে নাম যোগ করা
                                await axios.patch(`${refPath}/referrals.json`, { [chatId]: firstName });

                                // এই ইউজারকে মার্ক করা যাতে একবারই বোনাস দেয়
                                await axios.put(`${FIREBASE_URL}/users/${chatId}/is_referred.json`, true);
                                
                                // এডমিনকে সরাসরি মেসেজ পাঠানো
                                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                    chat_id: ADMIN_ID,
                                    text: `📢 সফল রেফারেল!\n\n👤 ইউজার: ${firstName}\n🆔 আইডি: ${chatId}\n🤝 রেফারার আইডি: ${startParam}\n🎁 বোনাস: ৫০০ চেরি যোগ হয়েছে।`
                                });
                            }
                        }
                    }

                    // ৩. ওয়েলকাম মেসেজ
                    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        chat_id: chatId,
                        text: `আসসালামু আলাইকুম ${firstName}!\n🧺🍒 PlumMine এ আপনাকে স্বাগতম।`,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "🧺 Play PlumMine", web_app: { url: "https://plum-mine.vercel.app" } }],
                                [{ text: "📢 Join Channel", url: `https://t.me/HasiEarnigZone` }]
                            ]
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error:", error.message);
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('PlumMine Active');
};
