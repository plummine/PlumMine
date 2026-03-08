const axios = require('axios');

module.exports = async (req, res) => {
    // শুধুমাত্র POST রিকোয়েস্ট হ্যান্ডেল করবে
    if (req.method === 'POST') {
        const { message } = req.body;
        
        // আপনার সঠিক বট টোকেন
        const BOT_TOKEN = "8617357036:AAEs-Q1zfl36_6FdL3A8b12XE3TpTksxpKU";

        if (message && message.text) {
            const chatId = message.chat.id;
            const userId = message.from.id; // ইউজারের আইডি
            const text = message.text;
            const userName = message.from.first_name || "User";

            // যদি কেউ /start লিখে বটে আসে
            if (text.startsWith('/start')) {
                const payload = text.split(' ')[1]; 
                
                // সঠিক ইউজারনেম দিয়ে তৈরি রেফারেল লিঙ্ক
                const inviteLink = `https://t.me/PlumMineTap_Bot?start=${userId}`;
                
                let welcomeMsg = `আসসালামু আলাইকুম ${userName}! 😊\n\n🧺 *PlumMine* এ আপনাকে স্বাগতম।\nএখানে আপনি ট্যাপ করে বড়ই (🍒) সংগ্রহ করতে পারবেন।\n\n🔗 *আপনার রেফারেল লিঙ্ক:*\n${inviteLink}\n\nবন্ধুদের ইনভাইট করে বোনাস সংগ্রহ করুন!`;
                
                if (payload) {
                    welcomeMsg += `\n\n🎁 আপনি ইউজার আইডি *${payload}* এর আমন্ত্রণে জয়েন করেছেন। আপনার বোনাস পয়েন্ট শীঘ্রই যুক্ত হবে!`;
                }

                // টেলিগ্রামে মেসেজ এবং প্লে বাটন পাঠানো
                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: welcomeMsg,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { 
                                text: "🎮 Play PlumMine 🧺", 
                                web_app: { url: "https://plum-mine-tap-tap.vercel.app" } 
                            }
                        ]]
                    }
                });
            }
        }
        return res.status(200).send('OK');
    }

    // ব্রাউজারে চেক করার জন্য
    res.status(200).send('PlumMine Bot Backend is Running! 🚀');
};
