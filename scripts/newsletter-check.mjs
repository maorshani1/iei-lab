/** Read-only provider configuration check. No contacts are requested or emails sent. */
const e=process.env,key=e.BREVO_API_KEY;
if(!key||!e.BREVO_NEWSLETTER_LIST_ID||!e.BREVO_NEWSLETTER_TEMPLATE_ID)throw Error('Newsletter provider configuration is missing.');
const get=async p=>{const r=await fetch('https://api.brevo.com/v3'+p,{headers:{'api-key':key},signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw Error('Provider check failed, HTTP '+r.status);return r.json();};
const [list,template,attributes]=await Promise.all([get('/contacts/lists/'+encodeURIComponent(e.BREVO_NEWSLETTER_LIST_ID)),get('/smtp/templates/'+encodeURIComponent(e.BREVO_NEWSLETTER_TEMPLATE_ID)),get('/contacts/attributes')]);
const required=['SERI_CONSENT_VERSION','SERI_SIGNUP_SOURCE','SERI_REQUESTED_AT'];
const result={listExists:!!list.id,templateActive:template.isActive===true,templateHasConfirmationLink:/\{\{\s*params\.DOIurl\s*\}\}/.test(template.htmlContent||''),consentAttributesPresent:required.every(n=>attributes.attributes?.some(a=>a.name===n&&a.type==='text')),liveDeliveryAndUnsubscribe:'still require an end-to-end test'};
console.log(JSON.stringify(result,null,2));
if(!Object.entries(result).filter(([k])=>k!=='liveDeliveryAndUnsubscribe').every(([,v])=>v===true))process.exitCode=1;
