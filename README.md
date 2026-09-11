# IEI Lab website: revision 4

10 September 2026. Prepared source and review output, not a live deployment.

## What is included

37 pages, the existing research and supervision content, a 23-record media archive, 30 conference/invited-talk records, 18 genuine publication-page thumbnails, a published ten-variable correlation explorer, and a local source-based question-answering guide. The homepage's hope-results table has been removed; its full research results remain on the results page.

The four real Ariel campus-photo entries have source/author/license credits. Their original image bytes could not be downloaded in the preparation environment. They therefore use remote image URLs until the caching step succeeds. **The portable HTML requires internet access for these campus photos.** Other included illustrations and publication thumbnails are embedded in the portable preview.

The included `scripts/cache-campus.mjs` downloads the four allowlisted images before the Vercel build. It uses explicit time and size limits and retains credited remote-source links on failure. Run `npm run assets:campus` to cache them locally. Verify actual photograph loading on a preview deployment before publication. An offline screenshot showing the source fallback is not evidence that the photos have been cached.

## Open the review

`review/IEI_Lab_Preview_v4.html` is a self-contained review of the site, apart from the four remote campus photos. Open it in a normal browser. Review forms are deliberately disabled. The source files and the built `dist/` also work on a static server.

## Build

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run review:html
```

Use `npm run build:production` only for approved public content. It enables the existing inquiry providers and removes review notices and noindex. It does not send a test inquiry.

`vercel.json` uses `npm run build:vercel`, publishes `dist`, and selects the static/Other framework. `scripts/vercel-build.mjs` builds review mode in Vercel preview/development and production mode in Vercel production. `VERCEL_ENV` must be available. The default root is the repository root, not an extra nested extraction directory. No domain, DNS, account, or live repository was changed while preparing this package.

See `MIGRATE_IN_CODEX.md` for safe replacement of the old React/TanStack project, backups, branch-based review, and the production switch. Do not promote a disabled-form review artifact to production; build again in production mode.

## Important boundaries

- The two unpublished experiments are NOT in this package, its JSON, search index, or public build. Their separate private aggregate review must not be added to the public repository without explicit scientific and release approval.
- The Ask the lab guide is curated keyword matching plus source links, **not a generative AI agent**. It has no API key, external model, conversation logging, or private-Drive access.
- The publication page has 18 actual first-page previews. Six other published entries still need an accessible source page/PDF; two forthcoming entries do not have fabricated covers. The PNAS Nexus preview is labeled as an accepted manuscript.
- The form JavaScript, configuration, and generator are byte-for-byte/function-for-function unchanged from the migration package. No live form submission or inbox test was performed in this revision.
- There are no font binaries in this package.

## Editing content

`site/content/media.json`: add media records without changing layout. `site/content/conferences.json`: add conference/talk records. `site/content/publications.json`: citations and optional preview filenames. `site/content/campus.json`: original image URLs, credits, licenses, and local cache names. `site/content/data-explorer.json`: approved published aggregate results only. `site/assets/lab-guide.js`: curated answers and their sources. `site/content/forms.json`: existing inquiry-provider configuration; preserve it deliberately.

`site/assets/` holds CSS, JS, and included images. `scripts/` holds build/preview/testing scripts. `dist/` is regenerated at each build. `review/` holds local review reports and is excluded from Git by `.gitignore`.

## Verification status

Structural tests: 37 generated pages and 1,550 local links/assets. Chromium rendered all 37 pages at 1440, 768 and 390 px (111 page/viewport cases) with actual local CSS/JS/assets. Separate tests covered the new controls, archive filters, publication modal, curated guide, portable routing, and downloads. Navigation to localhost/file URLs is blocked in the preparation environment, so these are in-memory browser tests, not deployed-host tests. Remote campus photo retrieval and actual email delivery remain to be checked in the intended deployment environment.

Read `REVISION4_REVIEW.md` before publishing. Keep archival CV dates distinct from current event confirmations.
