// stream3/auto-commit.js
// Writes commit params for a direct-to-main Stream 3 auto-push.
// No branch, no PR — content goes live immediately.
//
// Usage:
//   node auto-commit.js <params-json-path>
//
// Expected params JSON shape:
//   {
//     "files": [
//       { "path": "data/candidates-governor.json", "content": "..." }
//     ],
//     "date": "2026-05-19",
//     "raceName": "governor"
//   }
//
// Emits:
//   /tmp/stream3-autocommit.json  — params for GITHUB_COMMIT_MULTIPLE_FILES targeting main

const fs = require('fs');

const paramsPath = process.argv[2];
if (!paramsPath) { console.error('Usage: node auto-commit.js <params-json-path>'); process.exit(1); }

const { files, date, raceName } = JSON.parse(fs.readFileSync(paramsPath, 'utf-8'));

const commitParams = {
  owner: 'jessicabsimp',
  repo: 'vote4kids',
  branch: 'main',
  message: `Stream 3 auto: ${raceName} positions update · ${date}\n\nWeekly automated research pass (no PR review).\nExa searches run for each candidate on early_childhood_ed,\nchild_hunger, and parental_support.\n\nAuto-push enabled — content live immediately on Cloudflare.`,
  upserts: files.map(f => ({ path: f.path, content: f.content, encoding: 'utf-8' })),
};

fs.writeFileSync('/tmp/stream3-autocommit.json', JSON.stringify(commitParams));

console.log('Wrote /tmp/stream3-autocommit.json');
console.log('  branch: main (direct push — no PR)');
console.log('  upserts:', files.length, 'file(s)');
console.log('  race:', raceName, '·', date);
