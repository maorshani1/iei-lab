# Update the already-migrated IEI Lab website to version 4

Prepared 11 September 2026. This is source for an update, not a deployment report.

## Current state verified through GitHub

- Repository: `maorshani1/iei-lab`; default and previously used production branch: `main`.
- Pull request #1, "Migrate IEI Lab to supplied static website package", merged on 9 September 2026.
- Observed main commit: `f15a0cb6c27eba6436d96aee9a62549d1c2d81cd`.
- Observed Git tree: `e6c3b45c6ad92fd2e2fda9fa4fc2cf86ffbe1f81`.
- GitHub reports a successful Vercel deployment for that commit.
- Existing Vercel team: `maorshani-3052s-projects`; project: `iei-lab`.
- Public host: `https://www.maorshani.com`; keep the existing apex-domain redirect.

This is no longer a React/TanStack-to-static migration. The repository already uses this static site's `scripts/` and `site/` structure. Do not repeat the old migration or delete the repository. Refresh HEAD and check for newer or uncommitted work before applying this update.

The September 11 preparation session could read GitHub but could not create a backup branch (403 Resource not accessible by integration), and could not access the Vercel project (403 Forbidden). No remote write occurred. Use the existing, authorized local workspace from the successful migration session. Never ask for account secrets to be pasted into a conversation.

## Applying the update

1. Confirm the local repository's Git remote is `maorshani1/iei-lab`. Read `git status`, fetch allowed remote updates, and reconcile local changes. Do not reset, force-push, silently stash, or discard untracked files. Preserve `.git`, local environment files, and `.vercel/project.json` outside the publishable output.
2. Preserve the current production commit with a new verified backup reference. Create an update branch, for example `update/public-v4-2026-09-11`. If either name already exists, check it and choose a new name rather than overwrite it.
3. Overlay the supplied source contents into the existing repository root. Do not nest another `iei-lab` directory inside the repository. No existing tracked file needs deletion for this release. Preserve the historical `MIGRATION_CHECKS.json` unless deliberately archiving it; do not mistake it for current test output.
4. Inspect the diff, especially any changes made locally since the observed commit. The production form configuration, original form JavaScript, existing published results controller, original explorer data, and student profiles are unchanged from the verified main tree. Retain any newer intentional changes rather than overwrite them.
5. Run `npm ci --ignore-scripts`, `npm run build`, `npm test`, `npm run build:production`, and `npm test`. Test preview/production selection with `VERCEL_ENV=preview npm run build:vercel` and `VERCEL_ENV=production npm run build:vercel`. A missing VERCEL_ENV must stop the Vercel build, not silently publish disabled forms.
6. The supplied `vercel.json` retains `buildCommand: npm run build:vercel`, `outputDirectory: dist`, `installCommand: npm ci --ignore-scripts`, `framework: null`, clean URLs, and the existing inquiry-provider CSP settings. Its only CSP extension is the Wikimedia image host. Do not create a second Vercel project or change domain/DNS/billing settings. Confirm the existing project root and production branch are still correct.
7. Push the update branch and open a pull request. Let the existing GitHub integration create a preview. Inspect its exact commit, logs, all 37 pages, clean URLs, nested missing-page behavior, images, publication dialogs, archives, search, question guide, and published data explorer. Verify `/blog` is the overview page, not a directory error; verify the mobile heading keeps a space between “Experiences” and “and”.
8. Check all four actual campus photographs on the deployment. The Vercel build attempts to cache them; this preparation environment could not access their binaries. Do not claim they load based only on source URLs or local fallback text.
9. Present the working preview and any unresolved issues before the final public switch. On approval, merge to the verified production branch to trigger a **fresh production-mode build**. Do not point the public domain at the downloaded review HTML or an existing disabled-form review build.
10. Verify `maorshani.com` and `www.maorshani.com`, the new pages, production-mode forms, absent review banner/noindex, source/private-path exclusion, and the correct deployed commit. A provider response is not proof of inbox delivery; ask before sending clearly labeled real form-test messages. Report actual delivery testing separately.
11. After the remote merge, update the user's existing local clone without overwriting local edits, so their synchronized Drive folder is not left on the earlier version. Retain a simple rollback record.

## Preserved migration fixes

This source includes the exact behavior of the earlier migration fixes, which the unadjusted review ZIP would have reverted:

- Root-relative assets and navigation on 404 pages in **both** review and production modes.
- Local clean URLs such as `/blog` resolve `blog.html` before looking for a directory index.
- A literal space after the homepage line break prevents “Experiencesand” on narrow screens where the break is hidden.
- JPEG MIME support added for campus-photo caching is also retained.

## Public and private boundaries

The public update contains 37 website pages, campus-photo placements and credits, 18 genuine publication-page thumbnails, 23 media records, 30 conference/talk records, a curated question guide, and the **published** ten-variable Germany correlation matrix. It does not contain a generative-AI API or new paid service.

Do not upload any separate experimental review HTML, private analysis JSON, raw `.sav` files, participant data, author-review screenshots, or private ZIP. The experimental results remain under scientific/publication review even though they are aggregate. Source and output checks must confirm the public data bundle contains only `germany-published`, not the Ariel or bystander experimental bundles.

There is no redesign or statistical reanalysis to perform as part of this update. Keep the approved research content and the deliberate removal of the homepage hope table.
