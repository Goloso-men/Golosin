const http = require('http');
http.createServer((req,res)=>res.end('Golosin activo')).listen(process.env.PORT || 10000);
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const P = require('pino')
let saldos = {}
try{ if(fs.existsSync('./saldos.json')) saldos = JSON.parse(fs.readFileSync('./saldos.json')) }catch{}
const guardar=()=>fs.writeFileSync('./saldos.json', JSON.stringify(saldos))
async function start(){
 const { state, saveCreds } = await useMultiFileAuthState('auth')
 const sock = makeWASocket({ auth: state, logger: P({level:'silent'}) })
 sock.ev.on('creds.update', saveCreds)
 sock.ev.on('connection.update', u=>{
   if(u.qr) qrcode.generate(u.qr, {small:true})
   if(u.connection==='open') console.log('CONECTADO')
 })
 sock.ev.on('messages.upsert', async m=>{
  const msg=m.messages[0]; if(!msg.message||msg.key.fromMe) return
  const jid=msg.key.remoteJid
  const txt=(msg.message.conversation||msg.message.extendedTextMessage?.text||'').toLowerCase()
  const sender=msg.key.participant||jid
  if(!saldos[sender]) saldos[sender]=100
  if(txt.startsWith('!saldo')) await sock.sendMessage(jid, {text:`💰 Tienes ${saldos[sender]} monedas`})
  if(txt.startsWith('!trabajar')){ saldos[sender]+=50; guardar(); await sock.sendMessage(jid, {text:`+50! Total: ${saldos[sender]}`})}
  if(txt.startsWith('!menu')) await sock.sendMessage(jid, {text:`COMANDOS:\n!saldo\n!trabajar\n!ranking\n!menu`})
  if(txt.startsWith('!ranking')){ let top=Object.entries(saldos).sort((a,b)=>b[1]-a[1]).slice(0,5).map((x,i)=>`${i+1}. ${x[0].split('@')[0]} - ${x[1]}`).join('\n'); await sock.sendMessage(jid, {text:`🏆 Ranking:\n${top}`})}
 })
}
start()
