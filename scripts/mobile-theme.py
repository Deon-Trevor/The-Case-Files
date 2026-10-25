"""Apply the shared mobile layer to exported assets or a local Publii theme.

Usage: python3 scripts/mobile-theme.py [path/to/theme]
Run once against the active Publii theme before publishing. Existing template
settings and Handlebars files are preserved. Re-running updates one marked block.
"""
import argparse
from pathlib import Path
import shutil
import re
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
def patch(target,source,kind):
 start=f'/* CASE FILES MOBILE {kind} START */'
 end=f'/* CASE FILES MOBILE {kind} END */'
 existing=target.read_text()
 if start in existing:
  before,after=existing.split(start,1)
  if end not in after:raise ValueError(f'Incomplete mobile block in {target}')
  existing=before+after.split(end,1)[1]
 return existing.rstrip()+'\n\n'+start+'\n'+source.read_text().rstrip()+'\n'+end+'\n'
def install(destination,backup=True):
 pairs=[(destination/'assets/css/main.css',ROOT/'assets/mobile-casefiles/mobile.css','CSS'),(destination/'assets/js/main.js',ROOT/'assets/mobile-casefiles/mobile.js','JS')]
 # Validate both paths and patches before writing either file.
 changes=[(target,patch(target,source,kind)) for target,source,kind in pairs]
 for target,content in changes:
  if backup and target.resolve().is_relative_to(ROOT)==False:
   original=target.with_suffix(target.suffix+'.before-mobile')
   if not original.exists():shutil.copy2(target,original)
  target.write_text(content)
 return [str(target) for target,_ in changes]
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('theme',nargs='?',type=Path,default=ROOT);args=parser.parse_args()
 for path in install(args.theme.resolve()):print('Updated '+path)
 if args.theme.resolve()==ROOT:
  # Current exported pages receive new content fingerprints. Future Publii
  # exports fingerprint the patched theme assets themselves.
  hashes={kind:hashlib.md5((ROOT/f'assets/{kind}/main.{kind}').read_bytes()).hexdigest() for kind in ['css','js']}
  managed={'assets/css/main.css','assets/js/main.js'}
  count=0
  for page in ROOT.rglob('*.html'):
   if any(part in ['.git','output','amp'] for part in page.relative_to(ROOT).parts):continue
   before=page.read_text();after=before
   for kind,digest in hashes.items():
    pattern=rf'(assets/{kind}/main\.{kind}\?v(?:&#x3D;|=))[a-f0-9]+'
    if re.search(pattern,after,flags=re.I):managed.add(page.relative_to(ROOT).as_posix())
    after=re.sub(pattern,lambda m:m[1]+digest,after,flags=re.I)
   if before!=after:page.write_text(after);count+=1
  print(f'Updated asset fingerprints in {count} exported pages')
  manifest=ROOT/'files.publii.json'
  if manifest.exists():
   records=json.loads(manifest.read_text())
   for record in records:
    relative=record['path'].lstrip('/');path=ROOT/relative
    if record.get('type')=='file' and relative in managed and path.is_file():record['md5']=hashlib.md5(path.read_bytes()).hexdigest()
   manifest.write_text(json.dumps(records,indent=4))
