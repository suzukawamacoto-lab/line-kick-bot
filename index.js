const express = require('express');
 const line = require('@line/bot-sdk');
 require('dotenv').config();
 const config = {
   channelSecret: process.env.CHANNEL_SECRET,
   channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
 };
 const app = express();
 const bot = new line.Client(config);
 const ADMIN_ID = 'Uxxxxxxxxxxxxxxxxxxxxxxx';
 const protectedUsers = new Set();
 app.get('/', (req, res) => res.send('✅ Bot起動中！'));
 app.get('/health', (req, res) => res.send('OK'));
 app.post('/webhook', line.middleware(config), (req, res) => {
   Promise.all(req.body.events.map(handleEvent)))
     .then(() => res.status(200).end())
     .catch(err => console.error(err));
 });
 async function handleEvent(event) {
   if (event.type !== 'message' || event.message.type !== 'text') return;
   const { replyToken, source, message } = event;
   const userId = source.userId;
   const text = message.text;
   if (!text.startsWith('/')) return;
   const args = text.trim().split(/\s+/);
   const cmd = args[0].toLowerCase();
   const isAdmin = userId === ADMIN_ID;
   try {
     switch(cmd) {
       case '/help':
         return bot.replyMessage(replyToken, {
           type: 'text',
           text: '📖 コマンド一覧\n/protect <ID> - 保護\n/unprotect <ID> - 保護解除\n/prolist - 保護リスト\n/kick <ID> - 追い出す\n/help - このヘルプ'
         });
       case '/protect':
         if (!isAdmin) return replyErr(replyToken, '管理者のみ');
         if (!args[1]) return replyErr(replyToken, 'IDを指定');
         protectedUsers.add(args[1]);
         return bot.replyMessage(replyToken, { type: 'text', text: `✅ ${args[1]} 保護追加` });
       case '/unprotect':
         if (!isAdmin) return replyErr(replyToken, '管理者のみ');
         if (!args[1]) return replyErr(replyToken, 'IDを指定');
         protectedUsers.delete(args[1]);
         return bot.replyMessage(replyToken, { type: 'text', text: `🔓 ${args[1]} 保護解除` });
       case '/prolist':
         const list = protectedUsers.size ? Array.from(protectedUsers).join('\n') : '登録なし';
         return bot.replyMessage(replyToken, { type: 'text', text: `🛡️ 保護中:\n${list}` });
       case '/kick':
         if (!isAdmin) return replyErr(replyToken, '管理者のみ');
         if (!args[1]) return replyErr(replyToken, 'IDを指定');
         if (protectedUsers.has(args[1])) return bot.replyMessage(replyToken, { type: 'text', text: '🛡️ 保護中のため蹴れません！' });
         try {
           await bot.leaveGroup(args[1]);
           return bot.replyMessage(replyToken, { type: 'text', text: `👢 ${args[1]} を削除` });
         } catch(e) {
           return replyErr(replyToken, '失敗：IDまたは権限を確認');
         }
       default:
         return replyErr(replyToken, '/help を参照');
     }
   } catch(e) {
     return replyErr(replyToken, 'エラー');
   }
 }
 function replyErr(replyToken, text) {
   return bot.replyMessage(replyToken, { type: 'text', text: `❌ ${text}` });
 }
 const port = process.env.PORT || 3000;
 app.listen(port, () => console.log(`Bot起動: ポート ${port}`));
