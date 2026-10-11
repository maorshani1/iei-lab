# Assignment submissions: staged installation

This local installation package adds the approved course-first, bilingual submission area to the existing static website. It is a test installation, not permission to accept real student work.

## Build

The Vercel configuration runs `node scripts/submissions-vercel-build.mjs`. That wrapper runs the existing full build and regression tests first, generates the additional submission page, checks the resulting 41-page site, and runs the submission service tests. The original build scripts and research content are preserved.

## Privacy boundary

This repository contains only code, public assignment definitions, and synthetic tests. Real course rosters, source exports, minimized roster data, student numbers, email addresses, private folder mappings, and Google credentials must never be committed here. The roster helper is server-only preparation/reporting code. No student-facing roster endpoint exists. It does not grant access, establish enrollment, merge accounts, or change submission ownership.

The Google account used by the website requires separate authorization from the assistant's connected Drive account. The private database, sender, Drive mappings, and spreadsheet synchronization are not configured merely by deploying this branch. The source can compile without secrets because all runtime activation gates fail closed.

## Deliberate launch gates

`SUBMISSIONS_ENABLED`, `SUBMISSIONS_POLICY_APPROVED`, and `SUBMISSIONS_INTEGRATION_TESTED` must all be true and the runtime must be production before live intake is possible. Do not set these flags during this installation. Preview deployments remain disabled. No demo code can authenticate against the server.

Each student or team has an account-bound folder within the fixed assignment destination. Each attempt has its own child folder. Source filenames are retained only as metadata; server-generated filenames are used for stored work. Copies are not overwritten during resubmission.

## Not yet established by this package

Real Google authorization and refresh-token lifetime, Firestore IAM and database connectivity, email delivery, representative JASP/SPSS files, protected live integration testing, automatic Google Sheets updates, and the lecturer's periodic digest remain launch work. A successful build is not an end-to-end acceptance test. No student emails or real submissions may be used as test fixtures.

The website's owner must separately review personal-data storage arrangements and hosting plan eligibility before live coursework collection. No paid service or upgrade is authorized by this package.
