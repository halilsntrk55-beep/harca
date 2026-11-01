import {services} from '../lib/push.js';
export default async function handler(req,res){
  if(req.method==='GET')return res.status(process.env.VAPID_PUBLIC_KEY?200:503).json(process.env.VAPID_PUBLIC_KEY?{publicKey:process.env.VAPID_PUBLIC_KEY}:{error:'Kapalı uygulama bildirimi henüz sunucuda kurulmadı'});
  if(req.method!=='POST')return res.status(405).json({error:'POST gerekli'});
  try{const token=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!token)return res.status(401).json({error:'Giriş yapın'});const{auth,db}=services(),user=await auth.verifyIdToken(token),b=req.body||{};
    if(b.remove){await db.ref('pushSubscriptions/'+user.uid).remove();return res.status(200).json({ok:true});}
    const s=b.subscription,endpoint=String(s?.endpoint||'');if(!/^https:\/\/[A-Za-z0-9.-]+\//.test(endpoint)||endpoint.length>2000||!s?.keys?.p256dh||!s?.keys?.auth)return res.status(400).json({error:'Geçersiz bildirim aboneliği'});
    const host=new URL(endpoint).hostname;if(!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns2-db5p.notify.windows.com'].some(h=>host===h||host.endsWith('.notify.windows.com')||host.endsWith('.push.apple.com')))return res.status(400).json({error:'Desteklenmeyen push servisi'});
    if(!/^\d{2}:\d{2}$/.test(b.time||''))return res.status(400).json({error:'Saat gerekli'});try{new Intl.DateTimeFormat('tr',{timeZone:b.timeZone}).format(new Date());}catch{return res.status(400).json({error:'Geçersiz saat dilimi'});}
    await db.ref('pushSubscriptions/'+user.uid).set({subscription:s,time:b.time,timeZone:b.timeZone,enabled:true,lastSent:''});return res.status(200).json({ok:true});
  }catch(e){return res.status(503).json({error:e.message});}
}
