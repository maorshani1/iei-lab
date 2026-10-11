# Google connection setup

The backend uses two separate identities. Owner-approved OAuth supplies `drive.file` and `gmail.send` access for Drive, Sheets, and email. A dedicated service account supplies Firestore access through IAM. Credentials are server-only and remain outside the source tree.

## Owner authorization on macOS

Configure a Web application OAuth client in the dedicated teaching-submissions Google Cloud project. Its local setup callback is `http://127.0.0.1:8765/oauth2/callback`. Configure the owner's Google account as an allowed test user while the consent screen is in Testing.

Save the downloaded client configuration as `~/Downloads/seri-google-client.json`, then run:

```sh
node scripts/submissions-google-authorize.mjs
```

The helper listens only on `127.0.0.1`, opens Chrome, and requests the two scopes with offline access, a random state, a browser-bound cookie, and PKCE. It accepts one callback, verifies token renewal and the configured Drive account, and writes `google-oauth.json` under `~/Library/Application Support/SERI Teaching Submissions/`. The directory has mode `0700` and the credential file has mode `0600`. An existing credential file is not overwritten. Provider tokens, authorization codes, and secrets are not printed.

The listener expires after 20 minutes. If it expires before approval, rerun the helper. After successful authorization, it closes automatically. The helper sends no email.

Google OAuth grants in External Testing mode that include these scopes normally have a seven-day refresh-token lifetime. Before long-term operation, complete the appropriate consent publication and authorization steps and verify renewal again. OAuth publication and student-intake activation are separate controls.

## Isolated Drive and Sheets check

Run:

```sh
node scripts/submissions-google-check.mjs
```

This uses the application's saved OAuth credential to create or reuse an owner-only integration-test folder, a synthetic PDF, and a test spreadsheet. It verifies upload bytes, destination permissions, explicit-range spreadsheet writes, provider readback, and an idempotent repeated write. The spreadsheet contains only synthetic records. Private IDs and the check result are saved beside the OAuth credential in `google-integration-check.json`.

The fixture is separate from coursework destinations. This check does not verify Firestore, send email, configure Vercel, change intake flags, or establish representative JASP/SPSS compatibility. It does not delete existing files or change sharing permissions.

## Firestore identity

Use a dedicated backend service account in the teaching-submissions project with the Cloud Datastore User role (`roles/datastore.user`). The existing adapter accepts its JSON credential through the server-only `FIRESTORE_SERVICE_ACCOUNT_JSON` environment setting. Keep any downloaded credential outside the repository and outside browser-served folders.

Firestore server requests use IAM. The deny-all client rules in `firestore.rules` prevent direct client access; they do not restrict a server credential. Verify database identity, location, IAM access, encrypted read/write transactions, and retry behavior using an isolated collection of synthetic records before production configuration.

## Isolated backend workflow check

Save the downloaded service-account key as `~/Downloads/seri-firestore-service-account.json`, complete the Drive and Sheets check above, then run:

```sh
node scripts/submissions-backend-check.mjs
```

The check copies the service-account credential into the private application-support directory with mode `0600`. Separate test encryption and signing keys remain in that directory. It uses the `seri_submissions_integration_test` collection in the default Firestore database and a separate owner-only test register within the integration-test Drive folder. Synthetic records and uploaded files remain available for inspection.

The check verifies database identity and location, encrypted storage, concurrent transactions, sign-in with simulated email, account isolation, PDF upload and final naming, revisions R0 and R1, receipt retrieval, and automatic register updates. It simulates a lost Sheets response after a successful write, then verifies that retrying keeps a single row. Synthetic submission dates fall within a fixed catalogue window. Each run uses new synthetic accounts and adds two test submissions.

The result is saved as `backend-integration-check.json` beside the private credentials. This exercises application services and live Google adapters directly. Browser transport, deployed hosting configuration, actual email delivery, production destination folders, and student-intake activation require separate verification. No email is sent and no launch setting is changed by this check.

## Owner email delivery check

After explicit authorization to send a real message, run:

```sh
node scripts/submissions-mail-check.mjs --send-test-email
```

This sends exactly one synthetic test message to the configured owner using the backend Gmail adapter. The recipient and message are fixed in the script. A private attempt record is saved before sending; any existing attempt blocks another run, including when a provider response was uncertain. Provider acceptance is recorded separately from inbox delivery. Verify the received message before treating delivery as tested. This check changes no launch settings.

## Private coursework destinations

To prepare empty destinations independently of the synthetic fixtures, run:

```sh
node scripts/submissions-prepare-destinations.mjs
```

The helper creates or verifies a separate owner-only root, course folders, all assignment folders listed in the catalogue, and an empty submission register. Purpose and academic-year properties identify existing destinations on subsequent runs. A shared destination, unexpected parent, duplicate identifier, or populated register stops setup. No existing coursework is moved or deleted and sharing permissions are never broadened.

The register has the required 18 headers, a frozen header row, and capacity for at least 9,999 submissions. `coursework-destinations.json` in the private application-support directory contains the folder mapping and spreadsheet identifiers for server configuration. Setup does not add credentials to hosting, authorize a retention policy, or activate intake.

References: [Google server-side OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [refresh-token expiration](https://developers.google.com/identity/protocols/oauth2#expiration), and [Firestore IAM roles](https://docs.cloud.google.com/firestore/native/docs/security/iam).
