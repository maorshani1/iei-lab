(() => {
 'use strict';
 const form=document.getElementById('newsletter-form');if(!form)return;
 const status=document.getElementById('newsletter-status'),fields=form.querySelector('fieldset');
 const announce=(text,error=false)=>{status.textContent=text;status.dataset.state=error?'error':'';};
 if(document.body.dataset.mode!=='production'||location.protocol==='file:'){announce('Preview only. Registration will be available after the mailing service is connected.');return;}
 fetch('/api/newsletter',{cache:'no-store',headers:{Accept:'application/json'}}).then(async r=>{if(!r.ok)throw new Error();const data=await r.json();if(!data.enabled){announce('Newsletter registration is not open yet. Please check back soon.');return;}fields.disabled=false;announce('We will email a confirmation link. Your subscription begins after you confirm.');if(data.unsubscribeUrl){const link=document.getElementById('newsletter-unsubscribe');link.href=data.unsubscribeUrl;link.hidden=false;document.getElementById('newsletter-unsubscribe-note').hidden=true;}}).catch(()=>announce('Registration is temporarily unavailable. Please try again later.',true));
 let pending=false;
 form.addEventListener('submit',async event=>{event.preventDefault();if(pending||fields.disabled||!form.reportValidity())return;pending=true;const button=form.querySelector('button[type=submit]');button.disabled=true;announce('Requesting your confirmation email…');
  try{const r=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json','X-SERI-Newsletter':'1'},body:JSON.stringify({email:form.elements.email.value.trim(),consent:form.elements.consent.checked,website:form.elements.website.value,consentVersion:'2026-10-30'})});const data=await r.json();if(!r.ok)throw Object.assign(new Error(),{code:data.error});announce('Please check your inbox and spam folder for a confirmation link. If you are already subscribed, no action is needed.');form.reset();status.focus();}
  catch(e){announce(e.code==='RATE_LIMITED'?'Please wait before trying again. Check your inbox for an earlier confirmation email.':e.code==='INPUT_INVALID'?'Please enter a valid email address and select the subscription checkbox.':'We could not confirm that your request was accepted. Please check your inbox before trying again later.',true);status.focus();}
  finally{pending=false;button.disabled=false;}
 });
})();
