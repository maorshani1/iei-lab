# Apply the IEI Lab website migration

## User's requested outcome

Replace the old academic lab website with the supplied revision 3, using the existing maorshani.com domain, GitHub repository, and Vercel project. Do the file reorganization and deployment configuration for the user. Do not redesign the site or change research findings in this task.

This package has not been applied to the user's repository. It is prepared source, not a deployment.

## Verified remote identity and last observed state

- GitHub repository: https://github.com/maorshani1/iei-lab
- GitHub owner: maorshani1
- Default branch observed: main
- Last observed main SHA: 904db23520bed0f93805a2327a02d1d2584c8708
- Last observed Git tree: de660b2cb091f72b51bc3a55c68089581ed01871
- GitHub's Vercel status for that SHA reported a successful deployment:
  https://vercel.com/maorshani-3052s-projects/iei-lab/GztwByYHCKmyEuMmeHLcAeWdMT6u
- Vercel team slug from that status: maorshani-3052s-projects
- Vercel project slug from that status: iei-lab
- Existing canonical domain in the source: https://www.maorshani.com

Refresh all of this before writing. The last observed SHA is a comparison point, not a license to discard newer work.

## Previous connection limitations

The previous chat could read repository content. Creating backup/pre-v3-migration-2026-09-09 was rejected with 403 Resource not accessible by integration. That branch was NOT created. Vercel team listing returned no teams, and direct project access returned 403 Forbidden. Its deploy action also had an incompatible exposed argument schema. No remote branch, commit, pull request, deployment, or setting was changed.

Use the local coding workspace and the user's existing authorized Git/Vercel connection where available. Do not ask for passwords, access tokens, or private credentials pasted into a chat. Stop at a genuine authentication boundary and report the exact blocked action.

## Safe migration workflow

1. Locate the user's existing local website repository, or ask the user to select that folder. Do not confuse it with another research project or a ZIP extraction folder. Confirm git remote -v points to maorshani1/iei-lab, inspect status, fetch permitted remote updates, and check the actual production branch and project root.
2. Inspect any local changes. Do not reset, force-push, overwrite, or auto-stash them. Preserve tracked and untracked local work in a safe backup outside the publishable site, then reconcile or ask about conflicts. Preserve .git, authentication files, .vercel/project.json, and local environment files; do not publish them.
3. Create and verify a rollback branch or tag pointing to the current production source commit. Create a separate migration branch. Do not touch main until the replacement is tested. If a backup branch already exists, verify it and choose a new name rather than overwrite it.
4. Read the existing project files and latest form configuration. The original app uses React/TanStack; this package intentionally replaces it with a dependency-free static generator. Keep the original implementation retrievable in Git history and the rollback reference rather than merging incompatible package files. The old AGENTS.md contains generator-specific Grok sandbox assumptions, not a description of the new deployment environment.
5. Copy the contents of this package's iei-lab directory into the verified repository root on the migration branch, not into an extra nested folder. Preserve Git metadata and relevant local configuration. Remove obsolete tracked application/build files only within this verified repository and only after the backup exists. Do not leave the original public directory, server build output, or ZIP archives as additional publishable content. Check the full staged diff before committing.
6. Use the included vercel.json and npm run build:vercel. This version chooses review or production from VERCEL_ENV. Verify that the existing Vercel Root Directory points to the repository root and that system environment variables are exposed. Keep the existing project, domain, DNS, and unrelated account settings. Do not buy services or create a second hosting project.
7. Compare the latest original src/routes/contact.tsx, src/routes/participate.tsx, and src/data/lab.ts against site/content/forms.json. Retain the latest existing providers, form key, recipients, CC, redirects, and spam controls. Do not substitute a mailto helper. Do not print secrets. Handle a genuine difference deliberately rather than silently using an older copy.
8. Run npm ci --ignore-scripts; npm run build; npm test; npm run build:production; npm test. Verify review forms are disabled, production forms point to the intended providers, images load, site-wide search and the research charts work, and direct page URLs resolve. Test production headers and redirects on an actual deployment, not just local HTML. Keep private review/source documents out of dist and the published website.
9. Push the migration branch and open a pull request if the current Git credentials permit. Use the existing GitHub-to-Vercel integration to build a preview. Confirm its exact commit SHA, build outcome, page routes, assets, error behavior, and mobile layout. Do not describe noindex as password protection.
10. Confirm outstanding public-content decisions with Maor before the final switch, particularly permission to publish current student profiles. The Study 4 compromise mean is already omitted because its published sources disagree; do not guess a replacement or change research values. When the preview is approved, merge to the verified production branch and let Vercel produce a new production-mode build. Do not promote a disabled-form review artifact as production.
11. With explicit approval, submit one clearly labeled contact test and one participation test, then confirm receipt in the intended inboxes and CC destination. An API success response is not verified email delivery. Do not use real participant data for tests. Report exactly what was verified.
12. Verify both maorshani.com and www.maorshani.com route as intended and retain rollback instructions. Synchronize the user's existing local clone after any remote merge; Google Drive folder sync is not a substitute for git pull. Report the final branch/commit, PR and deployment links, form-test status, and any remaining limitations.

## Scope to preserve

Keep the white background, restrained Arial/Helvetica typography, descriptive academic headings, 32 pages, five clearly labeled generated illustrations, and the revision 3 research displays. All site/content files, CSS, imagery, form controller, and chart code in this package are unchanged from revision 3. The build also creates the ignored review directory before writing its manifest; the original clean-checkout build failed without that directory. No page templates or research values were changed.

## No irreversible changes

No force-push, history deletion, credential exposure, participant-data upload, DNS changes, provider replacement, or unrequested account/billing changes. If authorization still blocks a step, stop there rather than claim completion.
