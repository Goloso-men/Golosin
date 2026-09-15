const http = require('http');
http.createServer((_,res)=>res.end('ok')).listen(process.env.PORT||10000);
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_final');
  const sock = makeWASocket({
    auth: state,
    logger: P({level:'silent'}),
    browser: ['Ubuntu','Chrome','110.0.0.0']
  });
  sock.ev.on('creds.update', saveCreds);

  if(!state.creds.registered){
    let num = (process.env.PHONE_NUMBER||'').replace(/[^0-9]/g,'');
    if(!num){
      console.log('PHONE_NUMBER no definido en Render');
      return;
    }
    setTimeout(async()=>{
      try{
        let code = await sock.requestPairingCode(num);
        console.log('\n\n>>> CODIGO: '+code.match(/.{1,4}/g).join('-')+' <<<\n\n');
      }catch(e){ console.log('Error codigo', e.message); }
    }, 3000);
  }

  sock.ev.on('connection.update', d=>{
    if(d.connection==='open') console.log('>>> CONECTADO <<<');
  });

  sock.ev.on('messages.upsert', async m=>{
    const msg=m.messages[0];
    if(!msg.message) return;
    const jid=msg.key.remoteJid;
    const txt=(msg.message.conversation||msg.message.extendedTextMessage?.text||'').toLowerCase();
    if(txt==='/ping') await sock.sendMessage(jid,{text:'pong Golosin activo'});
  });
}
start();    try{
      const msg = m.messages[0]
      if(!msg.message || msg.key.fromMe) return
      const sender = msg.key.participant || msg.key.remoteJid
      const jid = msg.key.remoteJid
      const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim().toLowerCase()
      if(!text) return
      if(!saldos[sender]) saldos[sender]=100
      if(text.startsWith('/saldo')) await sock.sendMessage(jid,{text:`💰 Tu saldo: ${saldos[sender]}`})
      else if(text.startsWith('/trabajar')){ saldos[sender]+=50; fs.writeFileSync('./saldos.json',JSON.stringify(saldos)); await sock.sendMessage(jid,{text:`Trabajaste +50. Total: ${saldos[sender]}`}) }
      else if(text.startsWith('/meme')) await sock.sendMessage(jid,{text:`COMANDOS: /saldo /trabajar /meme /ranking`})
      else if(text.startsWith('/ranking')){ let top=Object.entries(saldos).sort((a,b)=>b[1]-a[1]).slice(0,5).map((x,i)=>`${i+1}. ${x[0].split('@')[0]}: ${x[1]}`).join('\n'); await sock.sendMessage(jid,{text:`🏆 Ranking:\n${top||'vacio'}`}) }
    }catch(e){ console.log(e) }
  })
}
start()      console.log("PHONE_NUMBER no definido en Render")
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
