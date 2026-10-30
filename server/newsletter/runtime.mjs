import {createHmac} from 'node:crypto';
import {FirestoreStore,ServiceToken} from '../submissions/adapters.mjs';
import {Newsletter,newsletterConfig,NewsletterError} from './service.mjs';
let instance;
export function runtime(){
 const config=newsletterConfig();if(!config.enabled)return config;if(instance)return instance;
 const env=process.env;
 if(!env.FIRESTORE_SERVICE_ACCOUNT_JSON||!env.SUBMISSIONS_SECRET||env.SUBMISSIONS_SECRET.length<43||!env.SUBMISSIONS_DATA_KEY)throw new NewsletterError('NEWSLETTER_UNAVAILABLE',503);
 const credentials=JSON.parse(env.FIRESTORE_SERVICE_ACCOUNT_JSON);
 // A separate collection and derived encryption key keep newsletter anti-abuse records independent of coursework records.
 const encryptionKey=createHmac('sha256',Buffer.from(env.SUBMISSIONS_DATA_KEY,'base64')).update('seri-newsletter-limits-encryption-v1').digest('base64');
 const store=new FirestoreStore({projectId:credentials.project_id,collection:'seri_newsletter_limits',token:new ServiceToken(credentials),encryptionKey});
 instance={enabled:true,newsletter:new Newsletter({config,store,secret:env.SUBMISSIONS_SECRET})};return instance;
}
