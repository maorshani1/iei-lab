import {Portal} from './core.mjs';
import {COURSES} from './catalogue.mjs';
import {fail} from './security.mjs';
import {UserToken,ServiceToken,FirestoreStore,DriveStorage,GmailSender} from './adapters.mjs';
import {SubmissionRegister} from './register.mjs';
import {GoogleSheetsRegister} from './sheets.mjs';
import {AssignmentTrackers,GoogleAssignmentSheets} from './trackers.mjs';
import {FailureAlerts} from './operations.mjs';
let instance;
export function configuration(env=process.env){
 // No live-mode shortcut exists for preview deployments or local demos.
 const live=env.SUBMISSIONS_ENABLED==='true'&&env.VERCEL_ENV==='production'&&env.SUBMISSIONS_POLICY_APPROVED==='true'&&env.SUBMISSIONS_INTEGRATION_TESTED==='true';
 if(!live)return {enabled:false};
 const required=['SUBMISSIONS_ORIGIN','SUBMISSIONS_SECRET','SUBMISSIONS_DATA_KEY','SUBMISSIONS_OWNER_EMAIL','SUBMISSIONS_RETENTION_NOTICE','SUBMISSIONS_FOLDER_MAP','SUBMISSIONS_REGISTER_ID','SUBMISSIONS_REGISTER_SHEET_ID','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','GOOGLE_OWNER_EMAIL','FIRESTORE_SERVICE_ACCOUNT_JSON','CRON_SECRET'];
 for(const k of required)fail(env[k]&&env[k].trim(),'CONFIGURATION_ERROR',503);
 const origin=new URL(env.SUBMISSIONS_ORIGIN);fail(origin.protocol==='https:'&&origin.origin===env.SUBMISSIONS_ORIGIN&&origin.hostname==='www.maorshani.com','CONFIGURATION_ERROR',503);
 fail(env.SUBMISSIONS_SECRET.length>=43&&Buffer.from(env.SUBMISSIONS_DATA_KEY,'base64').length===32&&env.CRON_SECRET.length>=32,'CONFIGURATION_ERROR',503);
 const folderMap=JSON.parse(env.SUBMISSIONS_FOLDER_MAP),credentials=JSON.parse(env.FIRESTORE_SERVICE_ACCOUNT_JSON);
 for(const c of COURSES)for(const a of c.assignments)fail(/^[A-Za-z0-9_-]{10,120}$/.test(folderMap[a.id]||''),'CONFIGURATION_ERROR',503);
 fail(new Set(Object.values(folderMap)).size===Object.values(folderMap).length,'CONFIGURATION_ERROR',503);
 fail(/^[A-Za-z0-9_-]{10,120}$/.test(env.SUBMISSIONS_REGISTER_ID)&&/^\d{1,10}$/.test(env.SUBMISSIONS_REGISTER_SHEET_ID)&&Number(env.SUBMISSIONS_REGISTER_SHEET_ID)<=2147483647,'CONFIGURATION_ERROR',503);
 return {enabled:true,origin:origin.origin,folderMap,credentials,env};
}
export function runtime(){const config=configuration();if(!config.enabled)return {enabled:false};if(instance)return instance;
 const {env,credentials,folderMap}=config,token=new UserToken({clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET,refreshToken:env.GOOGLE_REFRESH_TOKEN});
 const store=new FirestoreStore({projectId:credentials.project_id,token:new ServiceToken(credentials),encryptionKey:env.SUBMISSIONS_DATA_KEY});
 const drive=new DriveStorage({token,ownerEmail:env.GOOGLE_OWNER_EMAIL}),mail=new GmailSender({token,from:env.GOOGLE_OWNER_EMAIL,replyTo:'maorsha@ariel.ac.il'});
 const register=new SubmissionRegister({store,sheets:new GoogleSheetsRegister({token,drive,spreadsheetId:env.SUBMISSIONS_REGISTER_ID,sheetId:env.SUBMISSIONS_REGISTER_SHEET_ID})});
 const trackers=new AssignmentTrackers({store,sheets:new GoogleAssignmentSheets({token,drive})});
 const alerts=new FailureAlerts({store,mail,ownerEmail:env.SUBMISSIONS_OWNER_EMAIL});
 const portal=new Portal({store,drive,mail,register,trackers,alerts,secret:env.SUBMISSIONS_SECRET,ownerEmail:env.SUBMISSIONS_OWNER_EMAIL,folderMap});
 instance={enabled:true,origin:config.origin,retentionNotice:env.SUBMISSIONS_RETENTION_NOTICE,cronSecret:env.CRON_SECRET,portal};return instance;
}
