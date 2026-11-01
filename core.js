(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HarcaCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const money=v=>Math.round((Number(v)||0)*100)/100;
  const localDate=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;return localDate(new Date(s+'T12:00:00'))===s;}
  function monthDate(month,day){const[y,m]=month.split('-').map(Number);return localDate(new Date(y,m-1,Math.min(Math.max(1,Number(day)||1),new Date(y,m,0).getDate()),12));}
  function addMonths(date,n){const[y,m,d]=date.split('-').map(Number);const base=new Date(y,m-1+n,1,12);return monthDate(localDate(base).slice(0,7),d);}
  function splitInstallments(total,count){const cents=Math.round(Number(total)*100);if(!Number.isFinite(cents)||cents<=0||!Number.isInteger(count)||count<1||count>60)throw Error('Geçersiz taksit');const q=Math.floor(cents/count),r=cents%count;return Array.from({length:count},(_,i)=>(q+(i<r?1:0))/100);}
  function installments(expense,count,group){return splitInstallments(expense.amount,count).map((amount,i)=>({...expense,id:group+'_'+(i+1),amount,date:addMonths(expense.date,i),purchaseDate:expense.date,purchaseAmount:money(expense.amount),groupId:group,installment:i+1,installmentCount:count}));}
  function occurrences(rule,until,excluded=[]){if(!rule.active||!validDate(rule.start)||!validDate(until)||rule.start>until)return[];const out=[];let month=rule.start.slice(0,7);for(let i=0;i<1200&&month<=until.slice(0,7);i++){
    const date=monthDate(month,rule.day||Number(rule.start.slice(8)));const id='rec_'+rule.id+'_'+month;
    if(date>=rule.start&&date<=until&&(!rule.end||date<=rule.end)&&!excluded.includes(id))out.push({id,date,name:rule.name,amount:money(rule.amount),category:rule.category,payment:rule.payment,note:rule.note||'',recurringId:rule.id,subscription:!!rule.subscription});
    month=addMonths(month+'-01',1).slice(0,7);
  }return out;}
  function cycleDates(date,cutDay,dueDay){const month=date.slice(0,7);let statement=monthDate(month,cutDay);if(date>statement)statement=monthDate(addMonths(month+'-01',1).slice(0,7),cutDay);let due=monthDate(statement.slice(0,7),dueDay);if(due<=statement)due=monthDate(addMonths(statement,1).slice(0,7),dueDay);return{statement,due};}
  function cardDebt(card,items,transfers,opening=0,asOf=localDate()){
    const spent=items.filter(e=>e.payment===card&&(e.groupId?(e.purchaseDate||e.date)<=asOf:e.date<=asOf)).reduce((a,e)=>a+Number(e.amount||0),0);
    const paid=transfers.filter(t=>t.to===card&&t.date<=asOf).reduce((a,t)=>a+Number(t.amount||0),0);
    return money(Number(opening||0)+spent-paid);
  }
  function fingerprint(e){return[e.date,String(e.name).trim().toLocaleLowerCase('tr'),money(e.amount),e.category,e.payment,e.installment||''].join('|');}
  function normalizeExpense(e,categories,payments){if(!e||!validDate(e.date)||!String(e.name||'').trim()||!Number.isFinite(Number(e.amount))||Number(e.amount)<=0||!categories.includes(e.category)||!payments.includes(e.payment))throw Error('Geçersiz harcama satırı');const id=String(e.id||'');if(id&&!/^[A-Za-z0-9_-]{1,120}$/.test(id))throw Error('Geçersiz kayıt kimliği');return{...e,id:id||('imp_'+hash(fingerprint(e))),name:String(e.name).trim().slice(0,200),note:String(e.note||'').slice(0,2000),amount:money(e.amount)};}
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
  function mergeExpenses(existing,incoming){const ids=new Set(existing.map(e=>e.id)),prints=new Set(existing.map(fingerprint));const added=[];for(const e of incoming){if(ids.has(e.id)||prints.has(fingerprint(e)))continue;ids.add(e.id);prints.add(fingerprint(e));added.push(e);}return{items:[...existing,...added],added:added.length,skipped:incoming.length-added.length};}
  function csvCell(v){let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function toCSV(rows){return '\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');}
  function parseCSV(text){text=text.replace(/^\ufeff/,'');const sep=text.split(/\r?\n/)[0].includes(';')?';':',';const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===sep&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSV tırnakları kapanmamış');row.push(cell);if(row.some(Boolean))rows.push(row);return rows;}
  function parseNumber(value){let s=String(value).trim().replace(/\s|₺/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');return Number(s);}
  const categoryRules=[[/market|migros|bim\b|a101|şok|carrefour/i,'Market'],[/kahve|yemek|restoran|kafe|cafe|pizza|burger/i,'Yeme-İçme'],[/benzin|akaryakıt|otobüs|taksi\b|metro|ulaşım/i,'Ulaşım'],[/eczane|ilaç|hastane|doktor/i,'Sağlık'],[/netflix|spotify|sinema|oyun/i,'Eğlence'],[/elektrik|internet|fatura|doğalgaz|su faturası/i,'Faturalar'],[/kıyafet|ayakkabı|giyim/i,'Giyim'],[/bilgisayar|telefon|tablet|elektronik/i,'Teknoloji'],[/kitap|kurs|okul/i,'Eğitim']];
  function guessCategory(name){return categoryRules.find(([re])=>re.test(name))?.[1]||null;}
  function parseNatural(text,today=localDate()){
    let date=today;const explicit=text.match(/\b(\d{4}-\d{2}-\d{2})\b/);if(explicit&&validDate(explicit[1]))date=explicit[1];else if(/dün/i.test(text)){const d=new Date(today+'T12:00:00');d.setDate(d.getDate()-1);date=localDate(d);}
    const match=text.match(/(\d[\d.,]*)\s*(?:tl|lira|₺)/i);let payment=null;if(/akbank/i.test(text))payment=/hesap|banka kart/i.test(text)?'akbank-hesap':'akbank';else if(/enpara/i.test(text))payment=/hesap|banka kart/i.test(text)?'enpara-hesap':'enpara';else if(/ziraat/i.test(text))payment='ziraat';else if(/iş\s*(?:bank|kart)/i.test(text))payment='is';else if(/nakit/i.test(text))payment='nakit';return{name:text.slice(0,200),date,amount:match?parseNumber(match[1]):null,category:guessCategory(text),payment,note:''};
  }
  function monthForecast(items,month,income,fixed,debt=0,today=localDate()){
    const[y,m]=month.split('-').map(Number),days=new Date(y,m,0).getDate();const elapsed=month===today.slice(0,7)?Number(today.slice(8)):month<today.slice(0,7)?days:0;
    const selected=items.filter(e=>e.date.slice(0,7)===month);const regular=selected.filter(e=>!e.groupId&&!e.recurringId&&e.date<=today).reduce((a,e)=>a+Number(e.amount),0);const planned=selected.filter(e=>e.groupId||e.recurringId||e.date>today).reduce((a,e)=>a+Number(e.amount),0);const projected=elapsed?regular/elapsed*days+planned:planned;return{projected:money(projected),remaining:money(income-fixed-debt-projected),elapsed};
  }
  return{money,localDate,validDate,monthDate,addMonths,splitInstallments,installments,occurrences,cycleDates,cardDebt,fingerprint,normalizeExpense,mergeExpenses,toCSV,parseCSV,parseNumber,guessCategory,parseNatural,monthForecast,hash};
});
