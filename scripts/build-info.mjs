// Vercel build step: records when this version was deployed and from which commit.
// Writes build-info.js, which index.html loads before app.js. Not committed (see .gitignore).
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const now = new Date();
// Korea Standard Time (UTC+9, no daylight saving)
const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
const pad = (n) => String(n).padStart(2, '0');
const updated = `${kst.getUTCFullYear()}.${pad(kst.getUTCMonth() + 1)}.${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;

let commit = process.env.VERCEL_GIT_COMMIT_SHA || '';
if (!commit) {
  try {
    commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    commit = '';
  }
}
commit = commit.slice(0, 7);

const info = { updated, commit, builtAt: now.toISOString() };
writeFileSync('build-info.js', `window.GRAIN_ROOM_BUILD = ${JSON.stringify(info)};\n`);
console.log('build-info.js', info);
