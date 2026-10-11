/** Public descriptions of the lecturer-authorized Google integration. */
export const submissionInformationPages=[{
 path:'submissions-info',title:'SERI Lab Teaching Submissions',
 description:'Private coursework submission and confirmation service for courses taught by Dr. Maor Shani.',
 content:`<section class="container ser-section"><p class="eyebrow">Teaching services</p><h1>SERI Lab Teaching Submissions</h1>
 <p class="lead">Private coursework submissions, confirmations, and extension requests for courses taught by Dr. Maor Shani.</p>
 <p lang="he" dir="rtl">מערכת פרטית להגשת עבודות, לקבלת אישורי הגשה ולבקשות ארכה בקורסים של ד״ר מאור שני.</p>
 <p><a href="./teaching/submissions.html">Open the assignment submission area</a> to select your course and view its submission options.</p>
 <h2>How the service works</h2><p>Students choose their course and assignment, confirm their email with a one-time code, and upload the required files. Each completed attempt receives a confirmation. Revisions are preserved separately. Extension requests require an explicit decision by the lecturer.</p>
 <h2>Google account access</h2><p>The lecturer authorizes the service to create and manage its own submission folders, files, and register in Google Drive and Google Sheets, and to send sign-in codes, confirmations, and extension notifications through Gmail. Only the lecturer connects a Google account. Students verify their email through the submission service and do not grant it access to their Google accounts.</p>
 <p>The Google connection requests <code>drive.file</code> and <code>gmail.send</code>. It provides access to files created or explicitly authorized for this app and permission to send email. It does not provide inbox-reading access or unrestricted access to the lecturer’s Drive.</p>
 <h2>Privacy and contact</h2><p>Submission files and the register are private. Students can view confirmations associated with their verified email account. Read the <a href="./submissions-privacy.html">Teaching Submissions privacy notice</a> for information about records, storage, retention, and requests.</p>
 <p>Service operator: Dr. Maor Shani, SERI Lab. Questions: <a href="mailto:maorsha@ariel.ac.il">maorsha@ariel.ac.il</a>.</p>
 <p><a href="./teaching.html">Teaching at SERI Lab</a></p></section>`
},{
 path:'submissions-privacy',title:'Teaching Submissions privacy notice | SERI Lab',
 description:'Data access, storage, and retention information for SERI Lab Teaching Submissions.',
 content:`<section class="container ser-section"><p class="eyebrow">Teaching services · 11 October 2026</p><h1>Teaching Submissions privacy notice</h1>
 <p>This notice concerns <a href="./submissions-info.html">SERI Lab Teaching Submissions</a>, operated by Dr. Maor Shani. This notice describes the use of coursework records and the lecturer’s Google connection.</p>
 <h2>Information used by the service</h2><p>Submissions include a verified email address, name, student number, course and assignment, any listed team members, and uploaded files. Records also include filenames, file sizes, submission times, revision numbers, confirmations, and any reasons supplied for late submissions or extension requests. Sign-in challenges, sessions, and rate-limit records support secure access. A request’s network address is used to derive a rate-limit key; the application does not store that address in the submission record.</p>
 <p>Provide only information needed for the assignment or request. Do not upload identifiable research-participant data, protected test materials, medical documents, or unnecessary sensitive information.</p>
 <h2>Google permissions and storage</h2><p>The lecturer’s Google authorization provides the <code>drive.file</code> and <code>gmail.send</code> permissions. The service checks the connected account’s email address, creates or manages files authorized for this app in Google Drive, updates a private Google Sheets register, and sends service emails through Gmail. It does not request access to read the lecturer’s inbox or browse unrelated Drive files.</p>
 <p>Files and the register are stored in the lecturer’s Google account. Application records are stored in a private Google Cloud Firestore database, with sensitive record contents encrypted by the application. Encrypted recovery copies of these records are stored privately in the lecturer’s Google Drive. The application is hosted on Vercel. These providers process information needed to operate and secure their services. The application’s access credentials are kept outside public source code and browser files.</p>
 <h2>Access and use</h2><p>We use these records to receive and assess coursework, maintain confirmations and revision history, consider extension requests, communicate decisions, and operate the service. The lecturer has administrative access. Each verified student account can retrieve its own confirmations; the service provides no shared student file browser. Submission folders and the register are not shared with students or the public.</p>
 <p>We do not sell submission records or Google user data, use them for advertising, or send them to an AI service. Our use of information received from Google APIs follows the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including its Limited Use requirements.</p>
 <h2>Retention and requests</h2><p>Completed assignments, revisions, confirmations, and extension decisions remain in private storage until the lecturer removes them. The lecturer reviews continued retention after the course. No fixed automatic deletion period is configured. Expiry of a sign-in code or session ends its use for access; it does not delete coursework. Expired sign-in, session, and rate-limit records are eligible for removal during daily maintenance after a further day. Keep a local copy of your work and confirmation.</p>
 <p>For questions or requests concerning access, correction, or deletion, contact <a href="mailto:maorsha@ariel.ac.il">maorsha@ariel.ac.il</a>. Requests are reviewed in relation to assessment, unresolved course queries, and applicable university requirements.</p>
 <h2>Withdrawing the lecturer’s Google authorization</h2><p>The lecturer can remove this app’s access in <a href="https://myaccount.google.com/connections">Google account connections</a>. This prevents further authorized Drive, Sheets, and Gmail operations after existing access expires or is revoked. Revocation does not itself delete previously stored files or application records.</p>
 <p><a href="./submissions-info.html">About SERI Lab Teaching Submissions</a> · <a href="./privacy.html">General website privacy and accessibility</a></p></section>`
}];

export function renderSubmissionInformationPage(shell,page){
 const url='https://www.maorshani.com/'+page.path;
 return shell.replace(/<main id="main"[^>]*>[\s\S]*?<\/main>/,`<main id="main" tabindex="-1">${page.content}</main>`)
  .replace(/data-page="[^"]*"/,`data-page="${page.path}"`)
  .replace(/<title>[\s\S]*?<\/title>/,`<title>${page.title}</title>`)
  .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${page.description}">`)
  .replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${url}">`)
  .replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${page.title}">`)
  .replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${page.description}">`)
  .replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${url}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:page.title,description:page.description,url})}</script>`);
}
