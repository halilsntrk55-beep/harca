import {services} from '../lib/push.js';
export default async function handler(req,res){
  if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)return res.status(401).json({error:'Yetkisiz'});
  try{const{db,webpush}=services(),snap=await db.ref('pushSubscriptions').once('value');let sent=0;const now=new Date();
    for(const[uid,item]of Object.entries(snap.val()||{})){if(!item.enabled)continue;const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:item.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));const date=parts.year+'-'+parts.month+'-'+parts.day,time=parts.hour+':'+parts.minute;if(time<item.time||item.lastSent===date)continue;
      const expenses=await db.ref('users/'+uid+'/harcamalarim').orderByChild('date').equalTo(date).limitToFirst(1).once('value');if(expenses.exists())continue;
      const target=db.ref('pushSubscriptions/'+uid+'/lastSent'),lock=await target.transaction(current=>current===date?undefined:date);if(!lock.committed)continue;
      try{await webpush.sendNotification(item.subscription,JSON.stringify({title:'Harcamalarım',body:'Bugünkü harcamalarını kaydettin mi?'}));sent++;}catch(e){if(e.statusCode===404||e.statusCode===410)await db.ref('pushSubscriptions/'+uid).remove();else await target.set(item.lastSent||'');}
    }return res.status(200).json({sent});
  }catch(e){return res.status(503).json({error:e.message});}
}
