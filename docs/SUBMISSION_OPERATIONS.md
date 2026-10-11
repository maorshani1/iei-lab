# Teaching submission operations

The submission area is available at `https://www.maorshani.com/teaching/submissions`. Students verify their email, select an assignment, upload the required files, and retain the onscreen receipt. Completed revisions remain separate. A delayed email does not invalidate a receipt.

## Private records and retention

Assignment files and the submission register are stored in the lecturer's private Google Drive. Firestore stores encrypted application records. The lecturer reviews continued retention after the course; completed work is not deleted automatically. Retention reviews must also cover recovery copies.

The configured lecturer can sign in, select a course, and review extension requests. Decisions and manual retries require a sign-in within the preceding 15 minutes. The owner panel's retry control refreshes all assignment trackers and processes queued emails and register updates and reports any remaining backlog.

## Daily maintenance

Vercel invokes `/api/submissions-maintenance` once daily, using `CRON_SECRET`. This schedule fits the Hobby plan's daily scheduling limit. Notifications and register updates normally run immediately after a completed submission; the scheduled run retries failures. The owner control provides an additional retry without waiting for the daily run.

The maintenance endpoint requires the secret, creates a private encrypted recovery copy, removes up to 200 authentication or rate-limit records that expired more than a day ago, and processes pending queues. Completed submissions, revisions, receipts and extension records are excluded from this cleanup. Abandoned assignment files remain private for manual review.

Check Vercel's function and cron logs for `submission-maintenance` failures. The API reports aggregate counts, not submission contents. The retry controls preserve each submission's register row. Email retries may repeat the same receipt message after an uncertain provider response.

## Recovery copies

Daily `SERI_ENCRYPTED_RECORDS_YYYY-MM-DD.json` files are stored alongside the private register. Each copy includes encrypted records from a consistent Firestore read time. Sign-in codes, sessions and rate-limit records are excluded. Upload bytes and private permissions are verified before a copy is marked complete.

Snapshots are bounded to 10,000 retained records, 20,000 examined records and 25 MB. A capacity or provider failure is reported; it does not silently create a truncated copy. Maintenance must be reviewed before these limits are reached.

Keep `SUBMISSIONS_DATA_KEY` and `SUBMISSIONS_SECRET` recoverable in secure storage separate from the data copy. The encrypted snapshot alone cannot recover the records. Recovery should first be verified in an isolated collection: check the snapshot format and hash, decrypt its records with the matching key, and compare receipt and register references. Do not overwrite an active collection during verification. Google Drive contains the assignment files; the JSON snapshot contains application records rather than copies of assignment file contents.

## Configuration and rollback

Production requires all three launch gates, the canonical origin, the lecturer-approved retention notice, the private folder and register configuration, and the Google and Firestore credentials. Preview deployments keep the ordinary intake handler closed. Secrets belong in server-only settings and private recovery storage, never in source code or public assets.

To close intake, set `SUBMISSIONS_ENABLED=false` and deploy that configuration, or roll back to a verified closed deployment. Verify the public catalogue reports `enabled:false` and sign-in requests return `SUBMISSIONS_NOT_OPEN`. Existing private files and records should remain in place. Cron schedules need a separate check after a hosting rollback.

References: [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Firestore consistent document reads](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.documents/listDocuments).

## Assignment trackers and grading

Each assignment folder contains a private Google Sheet named with its assignment code and “Class Submission Tracker 2026-27”. The “Class status” tab includes every student in the private course roster. Before the deadline, unsubmitted work shows “Awaiting submission”; after the effective deadline it shows “Missing”. The effective deadline includes approved individual extensions. Exact verified email and student-number matches identify individual submissions. The most recent completed revision is displayed with its receipt and private files link.

Columns M–Q are lecturer fields: grade, grading status, feedback, notes, and the revision graded (for example, R0). Automatic refreshes preserve these fields. Column R warns when a grade refers to an older revision or the graded revision is unspecified. Sort or filter entire rows; do not remove roster rows or edit the hidden student keys. A whole-row sort preserves the relationship between the student and their grade. Google Sheets can be downloaded through File → Download → Microsoft Excel (.xlsx).

The “Needs review” tab lists uncertain identity matches and team membership. In column I, enter the confirmed student numbers separated by semicolons, including the submitter if appropriate; preserve leading zeros. Column J accepts lecturer notes. Sign in to the submission website and use “Refresh trackers and retry pending updates” to apply confirmations. The daily refresh also applies them. An unconfirmed named teammate is flagged rather than counted as a confirmed submission. Roster matching does not change student sign-in or access permissions.

Roster data and tracker destinations are encrypted application records, excluded from the public repository. Roster changes require a private roster update and a corresponding safe sheet update. Intelligence and Personality Tests has no assignment tracker because assessment is by examination.

## Failure alerts and independent checks

Completed submissions queue their tracker updates in the same database transaction as their receipt. Provider failures leave updates queued for retry. Daily maintenance refreshes every configured tracker, retries pending messages and register entries, and records an aggregate health result. Backup, credential cleanup, and queue processing run independently so that one failure does not prevent the other maintenance steps.

The service emails the lecturer when an upload-service, tracker, register, notification, or maintenance failure is detected. Alerts contain no student records and are limited to one attempt per problem category per 24 hours. Google authorization or a complete service outage can also prevent email delivery. The authenticated health endpoint checks database access, recent maintenance, tracker freshness, queued updates, and the private Google register connection; only aggregate status is returned.

The private recovery snapshot includes roster and tracking indexes. Grades and feedback remain in the Google Sheets files and their version history. Download an Excel copy after grading each assignment and keep it in private course storage. At the end of the course, review retention of files, Sheets, and encrypted recovery copies together.
