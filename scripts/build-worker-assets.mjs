import {spawnSync} from 'node:child_process';
import {copyFileSync, mkdirSync, rmSync, statSync} from 'node:fs';
import {dirname, join} from 'node:path';

const root = process.cwd();
const destination = join(root, 'output/worker-assets');
const tracked = spawnSync('git', ['ls-files', '-z'], {cwd:root});
if (tracked.status !== 0) throw new Error('Cannot list tracked site files');
const files = tracked.stdout.toString().split('\0').filter(Boolean).filter(path =>
  !path.startsWith('.') && !/^(docs|functions|scripts|src|test)\//.test(path) &&
  !['README.md', 'files.publii.json', 'wrangler.worker.toml'].includes(path));

// A case-insensitive checkout can silently replace one of two distinct media assets.
const seen = new Map();
for (const path of files) {
  const previous = seen.get(path.toLowerCase());
  if (previous && statSync(join(root,previous)).ino === statSync(join(root,path)).ino)
    throw new Error(`Case-colliding assets need a case-sensitive checkout: ${previous}, ${path}`);
  seen.set(path.toLowerCase(), path);
}

rmSync(destination, {recursive:true,force:true});
for (const path of files) {
  const target=join(destination,path);
  mkdirSync(dirname(target),{recursive:true});
  copyFileSync(join(root,path),target);
}
console.log(`Prepared ${files.length} tracked site assets`);
