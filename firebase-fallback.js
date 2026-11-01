/* SDK indirilemezse yerel kayıtları kullanabilmek için bağlantısız adaptör. */
if(!window.firebase||typeof window.firebase.database!=='function'){window.firebase={initializeApp(){},database(){return{ref(){return{once:async()=>{throw Error('Firebase SDK çevrimdışı');},set:async()=>{throw Error('Firebase SDK çevrimdışı');},update:async()=>{throw Error('Firebase SDK çevrimdışı');}};}};}};}
if(!window.Chart){window.Chart=class{static offlineFallback=true;constructor(){}destroy(){}};}
