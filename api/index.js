
const axios = require('axios');

// আপনার কনফিগারেশন - যা স্ক্রিনশট অনুযায়ী সঠিক আছে
const BOT_TOKEN = "8617357036:AAEs-Q1zfl36_6FdL3A8b12XE3TpTksxpKU";
const ADMIN_ID = "7741833062";
const FIREBASE_URL = "https://plumminebot-default-rtdb.firebaseio.com";
const CHANNEL_USERNAME = "@HasiEarnigZone";

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { message } = req.body;

            if (message && message.text) {
                const chatId = message.chat.id;
                const text = message.text;
                const firstName = message.from.first_name;

                // ১. স্টার্ট কমান্ড এবং ইউজারের নিজের নাম ডাটাবেসে সেভ করা
                if (text.startsWith('/start')) {
                    const startParam = text.split(' ')[1]; // রেফারেল আইডি

                    // ইউজারের প্রোফাইল আপডেট বা তৈরি (নাম নিশ্চিত করার জন্য)
                    await axios.patch(`${FIREBASE_URL}/users/${chatId}.json`, {
                        name: firstName
                    });

                    // ২. রেফারেল লজিক (সংশোধিত)
                    if (startParam && startParam != chatId) {
                        try {
                            // চেক করা হচ্ছে এই ইউজার আগে কখনো রেফার হয়েছে কি না
                            const referralCheck = await axios.get(`${FIREBASE_URL}/users/${chatId}/is_referred.json`);
                            
                            if (!referralCheck.data) {
                                const refPath = `${FIREBASE_URL}/users/${startParam}`;
                                const refResponse = await axios.get(`${refPath}.json`);
                                
                                if (refResponse.data) {
                                    let currentPoints = refResponse.data.points || 0;
                                    
                                    // রেফারারের পয়েন্ট ৫০০ বৃদ্ধি করা
                                    await axios.patch(`${refPath}.json`, {
                                        points: currentPoints + 500
                                    });

                                    // রেফারারের 'referrals' লিস্টে নতুন ইউজারের নাম ও আইডি সঠিকভাবে যোগ করা
                                    // এটি অবজেক্ট আকারে ডাটাবেসে সেভ হবে যাতে নামগুলো লিস্টে দেখায়
                                    await axios.patch(`${refPath}/referrals.json`, {
                                        [chatId]: firstName
                                    });

                                    // এই ইউজারকে 'referred' হিসেবে মার্ক করা যাতে একবারই বোনাস দেয়
                                    await axios.put(`${FIREBASE_URL}/users/${chatId}/is_referred.json`, true);
                                    
                                    // অ্যাডমিনকে নোটিফিকেশন দেওয়া
                                    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                        chat_id: ADMIN_ID,
                                        text: `📢 নতুন সফল রেফারেল!\n\n👤 ইউজার: ${firstName}\n🆔 আইডি: ${chatId}\n🤝 রেফারার: ${startParam}\n🎁 বোনাস: ৫০০ চেরি যোগ করা হয়েছে।`
                                    });
                                }
                            }
                        } catch (err) {
                            console.error("Referral Logic Error:", err.message);
                        }
                    }

                    // ৩. ওয়েলকাম মেসেজ ও বাটন পাঠানো
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
        } catch (error) {
            console.error("Main Bot Error:", error.message);
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('PlumMine Server is Active');
};
