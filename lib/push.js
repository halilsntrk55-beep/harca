import admin from 'firebase-admin';
import webpush from 'web-push';
export function services(){
  if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON||!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY)throw Error('Push kurulumu eksik: Firebase hizmet hesabı ve VAPID anahtarları gerekli');
  if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),databaseURL:process.env.FIREBASE_DATABASE_URL||'https://ubilsem-kds-default-rtdb.firebaseio.com'});
  webpush.setVapidDetails(process.env.VAPID_SUBJECT||'https://harcamalarim.example',process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  return{auth:admin.auth(),db:admin.database(),webpush};
}
