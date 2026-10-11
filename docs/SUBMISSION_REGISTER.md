# Private submission register

Completed submissions are recorded in Firestore and projected into an owner-only Google spreadsheet. Firestore remains the authoritative record. The spreadsheet contains one row per accepted attempt, including R0 and subsequent revisions, the receipt time and timing status, submitter details, team names, filenames, file sizes, and private Drive file identifiers. Incomplete and cancelled attempts are excluded. Extension requests and decisions remain in Firestore.

## Google authorization and destination

Use the website's own Google OAuth client with `drive.file` and `gmail.send`. The Sheets API accepts `drive.file`, so a broad Sheets or Drive scope is unnecessary. The connected assistant account does not provide credentials or file authorization to the website.

The register must be created or explicitly authorized through that OAuth client. Creating a spreadsheet manually or through a different application's Drive connection does not establish access for this client. Use an isolated register and synthetic records for integration testing.

Configure these server-only settings:

- `SUBMISSIONS_REGISTER_ID`: the private spreadsheet ID.
- `SUBMISSIONS_REGISTER_SHEET_ID`: the numeric ID of its data tab, including `0` when applicable.

Before using the register, provision it through the authorized application with:

1. The designated Google owner as its only owner and only permission entry. It must be outside shared folders and must have no public or student access.
2. The Drive application property `seriRegister` set to `v1`.
3. A grid tab with at least 18 columns and sufficient preallocated rows for the course. Row 1 must contain exactly the 18 values exported as `REGISTER_HEADERS` from `server/submissions/register.mjs`, in their original order.
4. Rows 2 onward initially empty. The database's register cursor and spreadsheet must be initialized together before collecting submissions. An existing populated register requires a deliberate migration.

The application validates ownership, permissions, the purpose marker, tab identity, headers, and capacity before each write. Missing access or a changed destination causes the write to fail closed. It does not change sharing permissions.

## Delivery and retries

The transaction that completes a submission also reserves its permanent row and queues its register update. After receipt delivery is attempted, the application attempts the spreadsheet write. A provider failure leaves the accepted submission intact and the register update queued.

Retries write the same explicit range with `valueInputOption=RAW` and verify the returned values. This preserves leading zeros in student numbers and stores formula-like text literally. If Google accepted a write but its response was lost, retrying replaces the same row instead of appending another. A row containing a different submission ID is rejected.

The existing authenticated drain action retries queued email and register updates. Its response includes register `synced` and `queued` counts. The owner POST action requires a fresh owner session and CSRF verification. The GET action requires `CRON_SECRET`. A retry schedule must be configured separately within the hosting plan's permitted limits. No schedule is defined by this feature.

Treat the data tab as application-managed. Use filter views or a separate analysis tab; do not insert, delete, reorder, or sort its physical rows. Expand its grid capacity before it fills. Changing the spreadsheet or tab ID requires an explicit migration of the register cursor and queued jobs.

The register is private and has no student-facing read endpoint. It retains student numbers and email addresses for the lecturer's administrative use. It must follow the same approved retention and access arrangements as the submission records. Do not place its contents or credentials in the repository.

## Verification before intake

Keep all three intake flags false during setup. Preview deployments remain disabled regardless of these flags. Use a separate test harness and isolated test storage to verify OAuth renewal, actual Firestore transactions, destination permissions, Sheets readback, lost-response retries, and owner-approved test email delivery before marking integration testing complete.

Primary API references: [Sheets authorization scopes](https://developers.google.com/workspace/sheets/api/scopes), [updating an explicit range](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update), and [Drive file authorization](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).
