const http = require('http');
http.createServer((req,res)=>res.end('Golosin activo')).listen(process.env.PORT || 10000);

const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const fs = require('fs')
const P = require('pino')
const qrcode = require('qrcode-terminal')

let saldos = {}
try {
  if(fs.existsSync('./saldos.json')) saldos = JSON.parse(fs.readFileSync('./saldos.json','utf8'))
} catch {}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  // ESTO ES LO DEL CÓDIGO
  if (!state.creds.registered) {
    let phoneNumber = process.env.PHONE_NUMBER || ''
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
    if (phoneNumber) {
      setTimeout(async () => {
        try {
          let code = await sock.requestPairingCode(phoneNumber)
          code = code?.match(/.{1,4}/g)?.join('-') || code
          console.log(`\n\n>>> CODIGO DE VINCULACION: ${code} <<<\n\n`)
        } catch(e){ console.log("Error pidiendo codigo:", e.message) }
      }, 3000)
    } else {
      console.log("PHONE_NUMBER no definido en Render")
    }
  }

  sock.ev.on('connection.update', async (v) => {
    const { connection } = v
    if (connection === 'open') console.log('CONECTADO GOLOSIN')
  })

  sock.ev.on('messages.upsert', async m => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return
      const sender = msg.key.participant || msg.key.remoteJid
      const jid = msg.key.remoteJid
      const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
      if(!text) return

      if(text.startsWith('/saldo')) {
        if(!saldos[sender]) saldos[sender]=100
        await sock.sendMessage(jid, {text: `💰 Tu saldo: ${saldos[sender]}`})
      }
      if(text.startsWith('/trabajar')) {
        if(!saldos[sender]) saldos[sender]=100
        saldos[sender]+=50
        fs.writeFileSync('./saldos.json', JSON.stringify(saldos))
        await sock.sendMessage(jid, {text: `Trabajaste +50. Total: ${saldos[sender]}`})
      }
      if(text.startsWith('/meme')) await sock.sendMessage(jid, {text: `COMANDOS: /saldo /trabajar /meme /ranking`})
      if(text.startsWith('/ranking')) {
        let top = Object.entries(saldos).sort((a,b)=>b[1]-a[1]).slice(0,5).map((x,i)=>`${i+1}. ${x[0].split('@')[0]}: ${x[1]}`).join('\n')
        await sock.sendMessage(jid, {text: `🏆 Ranking:\n${top || 'vacio'}`})
      }
    } catch(e){ console.log(e) }
  })
}
start()
