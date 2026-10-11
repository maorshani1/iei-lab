# Current installation status: v0.4, 10 October 2026

This update takes precedence over the preserved v0.3 notes below.

- New account-bound student/team and attempt subfolders are implemented locally and covered by tests.
- A server-only roster preparation/reporting helper accepts minimized private records. It is not an authentication or enrollment gate and is not connected to the live database.
- The new installer preserves the original build scripts and 40-page regression tests. It selects `scripts/submissions-vercel-build.mjs` as the Vercel build command. This runs the original build and tests before adding the 41st page and running submission tests. It does not append to the original elegant-build script or alter its page-count tests.
- Run `node install.mjs --repo /path/to/iei-lab` first, then the same command with `--apply` for a reviewed local installation. Run `VERCEL_ENV=preview node scripts/submissions-vercel-build.mjs` in the full checkout. Ordinary `npm run build` intentionally remains the original site build; `npm run build:submissions` is the additive local preview.
- No real roster belongs in the checkout. Drive-prepared working datasets are separate private files, not bundled here.
- All 83 local service tests pass with simulated providers. The real minimized roster records also pass the local schema and exact-email matching checks. Neither result establishes live mail delivery or cloud integration.
- A GitHub tree-write request was blocked by the platform before a test branch was created. It was not retried through another write route. No GitHub commit, Vercel deployment, production setting, billing plan or live intake flag was changed.
- A full existing-website build remains unverified: the full checkout could not be obtained in this environment. Do not claim that the wrapper or complete deployed site passed its build merely because the isolated service tests pass.
- No server secrets are configured in the Vercel project as observed in a metadata-only environment-variable check. Google OAuth, Firestore, actual private storage authorizations, spreadsheet synchronization, receipt delivery and live end-to-end tests are still pending.

---
## Preserved v0.3 setup reference (superseded where stated above)

# SERI Lab assignment uploads: implementation and activation checklist

Updated 2 October 2026, website-matched course-first v0.3. Status: **review implementation, NOT activated or deployed**.

## What this package is

This is an additive implementation for the existing static maorshani.com site. It is not a replacement repository. It includes one new generated page, one API entry point, isolated server modules, tests, an offline interface review, and an installer that defaults to a dry run. It introduces no third-party Node dependencies.

The inspected repository is `maorshani1/iei-lab`, main commit `beb23da525037d84e84a1e4fabe33bf88aa5de4d`. The existing `package.json`, elegant-build script, and regression scripts were read through the GitHub connection. The matching build script supplied in the earlier implementation backup has Git blob SHA `61182245278a60c45c46d29838c45f088ff7389e`.

The container could not clone the full repository. Consequently the full existing site's build/regression suite has **not** been run against this add-on. The installer checks the inspected file hashes and fails on drift. Run the complete existing build and both existing test suites in a full checkout before accepting a branch.

No GitHub branch was pushed, no Vercel deployment was made, no assignment-intake folders or permissions were configured, and no real email was sent. Earlier v0.2 review artifacts were saved to a separate version folder within Maor’s requested website-deliverables folder on Drive; that write does not activate the submission service.

## Course-first revision (v0.2)

The landing page begins with an unselected course field. No student details, email verification or upload form is shown before a course is selected. The selected course then determines the bilingual instructions, assignment menu, extension choices, personal confirmations and owner review queue. Statistics is grouped by semester. Intelligence and Personality Tests has no invented assignment or extension endpoint and does not request email verification merely to view its syllabus note.

An email session can be reused while changing course. A course change resets course-specific team names, selected files, late reasons, extension drafts and displayed receipts. Unsent drafts prompt before being cleared; completed server-side submissions are never deleted by course selection. Incomplete attempts can be reviewed in that course's confirmations. History endpoints validate course filters while retaining all account and owner checks. This is presentation/filtering, not course enrollment verification.

## Approved user choices

- Email-code sign-in without institutional SSO or course-roster checking. A verified email establishes mailbox control, not university enrollment or ownership of the declared student number.
- Student name and university student number, retained as text with leading zeros. Numbers are not login credentials or record lookup keys.
- One designated seminar submitter, with one or two additional team names. Account-bound team references are generated on the server. Names are included in private team-folder labels.
- English and Hebrew instructions and forms, side by side on larger screens and stacked on narrow screens.
- Restricted submission folders within the lecturer's three existing course folders. The Tests course currently has no assignment endpoints.
- Up to 25,000,000 bytes per file and 100,000,000 bytes per complete submission. Statistics normally requires two files; seminar assignments allow the configured role-specific file counts, at most six.
- Dates from the supplied syllabuses. The user approved the proposed 23:59 Israel-time setting. The technical cutoff includes the entire 23:59 minute (`23:59:59.999`). Department/programme confirmation of originally provisional syllabus dates is a separate launch check.
- Seven-day ordinary late window, mandatory late acknowledgment and brief reason, no automatic grade penalty, and preserved R0/R1/R2 attempts.
- Extension requests, explicit lecturer decisions, and account/assignment-specific overrides. An extension does not silently create another seven-day late window.
- Onscreen confirmation plus an emailed receipt. A short reference is retained. The reference is not a public access token.
- Email fallback to `maorsha@ariel.ac.il` only for a genuine technical problem, not merely for a missed deadline or delayed receipt email.

## Syllabus mapping

Source: `V1 24-Sep-26 Statistics I and Statistics II 2026.docx`, practical assignments table and requirements.

| Server ID | Menu label | Due date |
|---|---|---|
| stat1-a01 | Questionnaire report | 2026-11-15 |
| stat1-a02 | Group comparison | 2026-12-13 |
| stat1-a03 | Regression report | 2027-01-10 |
| stat2-a01 | Logistic regression report | 2027-03-21 |
| stat2-a02 | Moderation or mediation report | 2027-04-18 |
| stat2-a03 | Research analysis report | 2027-06-13 |

The report is PDF or DOCX. The default analysis format is JASP. An agreed equivalent must be added deliberately to the server catalogue; students cannot enable a format themselves. No additional final portfolio, weekly lab homework uploads, or exam uploads were invented.

Source: `03_Seminar_Syllabus_HE_2026-27_v3.docx`, proposed deadlines and final-paper requirements.

| Server ID | Menu label | Due date |
|---|---|---|
| sem-a01 | Revised research proposal / הצעת מחקר מתוקנת | 2027-01-10 |
| sem-a02 | Analysis and research documentation dossier / תיק ניתוח ותיעוד מחקר | 2027-05-23 |
| sem-a03 | Final seminar paper / עבודה סמינריונית סופית | 2027-07-18 |

Preregistration and classroom presentations have not been turned into new standalone upload requirements. Analysis/output files and required declarations remain part of the final-paper instructions, not new graded tasks.

Source: `Intelligence_and_Personality_Tests_Bilingual_Syllabus.docx`, assessment section. The syllabus proposes a final computer-based examination worth 100%. No coursework submission slots were added.

## Installation into a full local checkout

Keep `SUBMISSIONS_ENABLED=false` throughout development.

```bash
# Run from the unpacked review package. This does not write to GitHub or Vercel.
node install.mjs --repo /path/to/iei-lab

# Review the dry-run list, then install locally:
node install.mjs --repo /path/to/iei-lab --apply

cd /path/to/iei-lab
npm run build
npm test
npm run test:design
npm run test:submissions
```

The installer appends the submission-page generation step to the existing elegant build. It changes the two hard-coded page counts from 40 to 41, preserves the existing content tests, and adds `test:submissions`. It preserves existing Vercel settings while adding a 300-second limit for this specific function and no-store/noindex headers for the submission route. Backups go under the already ignored `private/` directory.

The new route is `/teaching/submissions`; lecturer review is an owner-only tab on the same page. The submission page is not added to the public search index or sitemap. Personal records are never emitted as static HTML.

The offline `review/` files must not be copied to `site/assets/` or `dist/`. They deliberately simulate the workflow and use a publicly displayed **demo-only** code. The production API has no demo-authentication branch.

## Runtime configuration and credentials

Use server-only encrypted/sensitive environment settings in the hosting platform. Never insert real secrets into the example file or put them in browser code, source commits, screenshots, or logs. Never reuse or extract ChatGPT connector credentials for the website.

The source adapter currently supports a lecturer-authorized Google account for both Drive and email, through the Google Drive and Gmail APIs. This is a code-level integration option, not authorization already obtained from the connected ChatGPT apps. It does not send as `maorsha@ariel.ac.il` without university authorization. It sends from the authorized Google mailbox and sets the university address as Reply-To. A different approved transactional email adapter can replace it without changing the submission UI.

Required server settings are listed in `submissions.env.example`:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a separately obtained `GOOGLE_REFRESH_TOKEN`. Request the narrow `drive.file` and `gmail.send` scopes. Check consent-screen publication/refresh-token lifetime before production use. A development token that expires after seven days is not a production setup.
- `GOOGLE_OWNER_EMAIL`: exact authorized Drive/mail owner. The Drive adapter refuses other owners and any non-owner permission entries.
- `SUBMISSIONS_OWNER_EMAIL`: the exact email permitted to review extension requests, configured privately. Review/decision actions require sign-in within the preceding 15 minutes.
- `FIRESTORE_SERVICE_ACCOUNT_JSON`: a dedicated server credential for a separate private Firestore database, not a credential with access to the lecturer's entire Google account. The browser has no direct Firestore access. Apply deny-all client rules and least-privilege IAM separately. Choose an approved database region and verify costs and quotas before provisioning.
- `SUBMISSIONS_SECRET`: high-entropy random material for keyed hashes; at least 32 random bytes, encoded as base64url. Do not change it casually: it defines stable account references.
- `SUBMISSIONS_DATA_KEY`: 32 random bytes encoded as base64 for authenticated encryption of private register payloads. Establish a secure backup and rotation procedure before collecting data.
- `SUBMISSIONS_FOLDER_MAP`: nine server-only assignment IDs mapped to approved fixed Drive folder IDs. Client-supplied paths, folder IDs and URLs are rejected.
- `SUBMISSIONS_RETENTION_NOTICE`: the approved retention statement, displayed on the submission page. Use an accurate lecturer-approved notice; do not invent a university retention period. Maor reports no prescribed period. See the retention clarification below. Storage/processing authorization remains a separate pre-launch check.
- `CRON_SECRET`: a separate random secret for authorized retries of queued emails.

All three activation flags, plus `VERCEL_ENV=production`, are required: `SUBMISSIONS_ENABLED`, `SUBMISSIONS_POLICY_APPROVED`, and `SUBMISSIONS_INTEGRATION_TESTED`. Their default is false. A preview deployment stays disabled even if someone accidentally supplies production settings. Do not mark a gate complete until the corresponding work is actually verified.

## Drive setup and privacy

Create app-authorized `Submissions_2026-27_PRIVATE` folders beneath the three verified course folders, then fixed assignment subfolders. For Statistics, use semester subfolders if preferred; the server ultimately maps directly to each assignment folder. For the seminar, the backend creates only the account-bound team subfolder inside that fixed assignment folder.

Inspect ownership, direct permissions and inherited permissions. A generic folder name or hidden link is not an access control. If the course parent is shared, explicitly configure and verify a limited-access child or choose an actually private location; this adapter will refuse a folder with any non-owner permission. It does not silently alter sharing permissions.

Students receive no Drive permissions, Drive links, resumable session URLs, folder listings, or document-download routes. All retrieval of confirmation metadata requires the same verified email account. A team name or student number cannot grant another account access.

Each completed file has a newly allocated Drive file ID. Files are never overwritten when resubmitting. Team-folder names contain the supplied team names; filenames use this pattern, with an Israel-time timestamp:

```text
R0_2026-27_SEM_A01_Demo_Student_20270110-213000_report1.pdf
R1_2026-27_SEM_A01_Demo_Student_20270110-224500_report1.pdf
```

The same template can be reproduced for an email fallback when the entire portal is unavailable. The full server-generated names are shown when an attempt already exists. Drive file IDs, not user-provided filenames, distinguish stored objects. Original filenames remain in the private register.

Changing the designated seminar submitter requires a deliberate staff-assisted account/team migration. Entering the same team code or names from another account does not take over that team's submissions.

## Upload and receipt behavior

Files transfer through the same-origin API in 2,097,152-byte chunks, below Vercel's documented per-request body limit and aligned to Drive's 256 KiB chunk requirement. The backend stores Drive resumable credentials only in encrypted private records. Fixed upload destinations are selected on the server.

Uploads have a two-hour completion window. The server checks size limits, required roles, byte hashes, and bounded structural signatures. The ZIP-based formats receive bounded container checks, encrypted-container checks and Office macro checks. PDF checks detect common encrypted and active-content declarations. General ZIP/RAR archives, macro-enabled Office files, HTML, executables and unsupported extensions are rejected.

These checks do **not** establish that files are malware-free, academically correct, anonymized, or free of every possible active-content technique. No file is executed or rendered by the website. Real files from the course versions of JASP and SPSS must be included in integration testing. The included synthetic tests do not establish compatibility with every analysis-file version. Apply the approved staff scanning/opening workflow; do not submit student work to a public scanning or AI service.

No success receipt is created until every required file is stored and validated, destination permissions are checked, final filenames are applied, and a transactional completion record is committed. The receipt uses the time the final required file was server-confirmed, rather than the student device's clock. An upload begun before the cutoff can still be late. If the provider's completion cannot be confirmed after a network failure, conservative handling and the technical-failure review process apply.

The system preserves complete attempts, uses one pending attempt per account/assignment, and retains request identifiers so retries do not create new revisions. Failed/cancelled incomplete attempts do not consume R numbers. Incomplete files retain an `INCOMPLETE_` name and are not accepted coursework. Do not automatically delete them until the agreed cleanup procedure is configured.

The record preserves timing status separately from revision order. A later late submission does not change or delete the earlier on-time receipt. There is no grading automation.

Email notification uses a transactional outbox. A stored submission remains valid if email is delayed. The onscreen status distinguishes queued email from acceptance by the email provider; provider acceptance is not a claim of inbox delivery. Gmail retries are at-least-once: an ambiguous provider response can cause a duplicate notification with the same reference. It cannot create another submission.

Set up an approved retry schedule for `GET /api/submissions?action=drain` with `Authorization: Bearer <CRON_SECRET>`, or the hosting platform's supported secret-injection mechanism. Verify the actual plan's scheduling limits. No recurring job or paid service was provisioned in this work. There is also an owner-authenticated API action for manual retry. Queue health, quota exhaustion and provider authorization expiry must be monitored operationally.

## Extension and email-fallback workflows

An extension request does not alter the deadline. Approval/decline requires a fresh owner session and CSRF protection. GET requests and opening notification links cannot approve a request. Approval binds to the verified account and assignment, not the freely entered name or student number. The decision and notification remain in the private register.

The fallback explains genuine failures, gives file-naming guidance, and prepares an email draft only after the student chooses that route. It never automatically emails assignment attachments. Opening a composer is not proof of sending or receipt. A complete onscreen receipt should not be followed by a duplicate email submission merely because the receipt email is delayed.

Manual intake of fallback emails into the register, preserving their original email receipt time, still needs an explicit administrative import workflow. This first implementation does not read the lecturer's inbox or silently import email attachments. Until such a workflow is added, use a private staff log and acknowledgment; do not pretend that a website receipt exists for an email-only submission.

## Testing completed in this environment

See `review/core-test-report.txt` and `review/browser-test-report.json`.

- 70 local Node tests passed using injected in-memory storage and fake Drive/email adapters. They cover syllabus dates, OTP expiry and reuse, rate limiting, ownership isolation, unexpected destination fields, private-folder failures, completed-revision preservation, lost responses, delayed notifications, deadline boundaries, extension authorization, HTTP origin/CSRF checks, and disabled-mode behavior.
- The real attached seminar DOCX passed the local structural validator. No user document was sent anywhere.
- 19 interface checks passed in an inline-rendered Chromium review at widths 390, 768, 1024 and 1440 pixels. The v0.2 review had no JavaScript page errors or outbound network requests in those checks. Tests include all three course choices at all four widths, course-filtered history, and a cancelled course switch preserving an unsent draft. Chromium was driven by the available Playwright installation and rendered directly as local content. This is not a live-site navigation test.

Not yet verified: a full repository build after installation; live Google OAuth; folder scope/permission behavior in the chosen account; Firestore IAM, region and transaction behavior; real Gmail sending and quotas; scheduled outbox retries; representative large course files; deployed function bundling/timeouts; storage/processing authorization and the final student-facing retention notice; end-to-end tests from two actual test mailboxes; and independent security review.

## Retention clarification from Maor, 2 October 2026

Maor states that there is no institutional policy specifying an assignment-retention period. This records the owner's clarification, not an independent legal or institutional-compliance finding.

No automatic deletion of completed assignments, earlier R0/R1/R2 versions, receipts or extension decisions is enabled. Existing records must not be deleted simply because this clarification was received. Equally, the clarification does not mean records should be retained forever.

Suggested practical arrangement, not an existing requirement or scheduled automation: keep the files and attempts privately for grading and handling course-related queries; review continued need after final grades and again approximately twelve months later. Preserve anything still needed for an unresolved query, review or other applicable requirement. Any subsequent deletion or anonymization requires an explicit scope and approval. A deletion workflow is not implemented or scheduled in this revision.

Before activation, agree the short student-facing statement with Maor and configure it using `SUBMISSIONS_RETENTION_NOTICE`. Draft language for review:

English: “Your files and submission records are stored privately for assessment and handling course-related queries. The lecturer will review their continued retention after the course. Keep your own copy of your work and receipt.”

עברית: “הקבצים ורישומי ההגשה נשמרים באופן פרטי לצורך הערכה וטיפול בפניות הקשורות לקורס. לאחר סיום הקורס יבחן המרצה את הצורך בהמשך שמירתם. שמרו אצלכם עותק של העבודה ושל אישור ההגשה.”

Short-lived sign-in codes, sessions and abandoned-upload fragments are separate operational data. Their expiry and safe cleanup should not be confused with completed-assignment retention.

## Launch checklist (all are blockers)

1. Reconcile/install in a full checkout; run the existing 41-page structural/design tests and the add-on tests. Review the diff without changing research content.
2. Review the bilingual interface and notices with the lecturer. Confirm course-version file compatibility and any approved analysis alternatives.
3. Obtain owner-controlled Google authorization, configure the private database/IAM and keys, and validate every destination's permissions. Verify email sender authorization and reply address.
4. Confirm storage/processing authorization and the lecturer-approved retention notice. Do not wait for a retention period that Maor says does not exist. Agree the manual review/deletion approach described below, configure backups and key recovery, and define cleanup of expired sign-in data and abandoned uploads. Set sensible operational quotas and alerts. No automatic deletion of completed submissions is enabled in this package.
5. Exercise separate test mailboxes against isolated test storage in a dedicated test harness/project, not the production data. Verify owner vs student access, R0/R1/R2, near-deadline transfers, interrupted uploads, identity changes, partial failures, and delayed emails.
6. Verify deployed behavior with live intake still disabled. No preview should use real student records or production authorization for test uploads.
7. Obtain the lecturer's release approval, then set the production flags deliberately and verify the real domain. Keep a fast shutdown path: `SUBMISSIONS_ENABLED=false` plus redeploy/restart as required by the hosting platform.

## Primary technical references used

- Vercel function limits: https://vercel.com/docs/functions/limitations
- Google Drive uploads: https://developers.google.com/workspace/drive/api/guides/manage-uploads
- Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firestore REST API: https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.documents
- Gmail send API: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send
- OWASP file upload guidance: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

These references inform the implementation. They do not substitute for the remaining integration and security checks.

## Website-matched style revision (v0.3)

The existing Teaching page shell still supplies the production header, footer, site.css and elegant.css. The page content now uses `.container` and `.page-intro`, inherits the body and heading typography, and has readable labels and controls with fewer borders and badges. No separate production font files or external font service is used. The offline reference CSS is not installed into the website.

The API, backend and browser-behavior files are unchanged from v0.2. The existing 70 Node tests and 19 workflow checks were rerun; nine new local typography/reflow checks passed. A full website build and live end-to-end tests are still required before deployment or activation. See CHANGELOG_v0.3.md for the exact source comparison and limits.
