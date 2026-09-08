/** Select the correct site build without changing Vercel dashboard commands. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const environment = process.env.VERCEL_ENV;
if (!['production', 'preview', 'development'].includes(environment)) {
  console.error(
    'Build stopped: VERCEL_ENV is missing or unsupported. ' +
    'In Vercel, enable Automatically expose System Environment Variables and retry. ' +
    'For a local review use npm run build; for a local production check use npm run build:production. ' +
    'This guard prevents silently publishing a review build with disabled inquiry forms.'
  );
  process.exit(1);
}
const production = environment === 'production';
console.log(`IEI Lab: ${environment} deployment; inquiry forms ${production ? 'enabled' : 'disabled'}.`);
try {
  execFileSync(process.execPath,
    [path.join(root, 'scripts/build.mjs'), ...(production ? ['--production'] : [])],
    { cwd: root, stdio: 'inherit' });
} catch (error) {
  console.error('IEI Lab build failed. The deployment must not be promoted.');
  process.exit(Number.isInteger(error.status) && error.status !== 0 ? error.status : 1);
}
