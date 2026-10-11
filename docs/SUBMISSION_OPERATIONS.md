# Teaching submission operations

The submission area is available at `https://www.maorshani.com/teaching/submissions`. Students verify their email, select an assignment, upload the required files, and retain the onscreen receipt. Completed revisions remain separate. A delayed email does not invalidate a receipt.

## Private records and retention

Assignment files and the submission register are stored in the lecturer's private Google Drive. Firestore stores encrypted application records. The lecturer reviews continued retention after the course; completed work is not deleted automatically. Retention reviews must also cover recovery copies.

The configured lecturer can sign in, select a course, and review extension requests. Decisions and manual retries require a sign-in within the preceding 15 minutes. The owner panel's retry control processes queued emails and register updates and reports any remaining backlog.

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
