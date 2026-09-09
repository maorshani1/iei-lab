# IEI Lab: migration-ready revision 3

This is the same 32-page static website, research content, images, typography, and form implementation delivered as IEI_Lab_Website_v3.zip. The migration package adds automatic Vercel build-mode selection and fixes a first-build error by creating the ignored report directory before writing the build manifest. It does not itself change GitHub, Vercel, Google Drive, or the live domain.

## Deployment configuration

The repository-root vercel.json selects Other (framework: null), runs npm run build:vercel, and publishes dist. The install command is npm ci --ignore-scripts. There are no runtime npm dependencies; use Node.js 20 or later.

scripts/vercel-build.mjs uses Vercel's VERCEL_ENV variable:

- production: builds with --production, enables the existing inquiry forms, and removes review notices and review noindex.
- preview or development: builds the review version, with inquiry submissions disabled and noindex.
- missing or unsupported value: stops the build rather than guessing. Vercel's Automatically expose System Environment Variables setting must be enabled. It is enabled by default for new projects, but the current project's setting could not be inspected through the connection.

The code-level build, framework, and output-directory settings override their corresponding Vercel dashboard settings. The project Root Directory and production branch still need to match the actual repository. No DNS changes or new Vercel project are needed for this migration.

Do not promote a preview-mode artifact directly to production. Merge the approved branch to the configured production branch and allow a fresh production build.

## Local verification

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run build:production
npm test
```

These commands do not send inquiries. No live provider request or inbox-delivery test has been performed in this migration session.

## Source layout

- site/content/*.json: research, publications, supervision, images, and existing form-provider configuration.
- site/assets/: CSS, JavaScript, illustrations, and social-card assets.
- scripts/build.mjs and scripts/results-template.mjs: page generation.
- scripts/vercel-build.mjs: deployment-environment selection.
- dist/: generated public site, not source; recreated at each build.
- review/: locally generated checks, ignored by Git.

The public output contains neither the original source ZIP nor private review documents. No font binaries are included.

## Forms and scientific content

Web3Forms is retained for contact inquiries. FormSubmit is retained for participation inquiries, including the existing CC destination, routing fields, and honeypots. The source form configuration and controller are byte-for-byte unchanged from revision 3. The form access key in the source is the existing public Web3Forms form key, not a private server credential.

All research content and numerical values are unchanged from revision 3. The unresolved Study 4 compromise-mean discrepancy remains unresolved and that mean remains omitted. Before public launch, confirm current student-profile permissions and any outstanding content-review decisions recorded in the earlier review package.

## Next action

Use MIGRATE_IN_CODEX.md in a local coding workspace with access to the existing maorshani1/iei-lab repository. Do not drag this package over the live repository without first preserving Git history and local changes.

## Documentation

- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/environment-variables/system-environment-variables
