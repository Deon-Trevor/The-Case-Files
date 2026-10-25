"""Package the one-time asset update for the existing local Publii theme."""
from pathlib import Path
import zipfile

root=Path(__file__).resolve().parents[1]
destination=root/'downloads/case-files-mobile-theme-update.zip';destination.parent.mkdir(exist_ok=True)
readme='''CASE FILES — ONE-TIME PUBLII THEME UPDATE

This is an asset update for the existing Case Files theme, not a complete theme.
Back up the active theme before applying it.

Merge assets/css/main.css and assets/js/main.js into the active Case Files
theme on your computer. Replace only those two files, then publish normally.
New posts will inherit the mobile controls without individual post edits.

Alternatively, preserve additional local changes by running:
python3 scripts/mobile-theme.py /absolute/path/to/active-case-files-theme
from this extracted bundle. The script saves .before-mobile backups.

Read MOBILE-THEME.md for details and verification limits.
'''
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
 for name in ['assets/css/main.css','assets/js/main.js','assets/mobile-casefiles/mobile.css','assets/mobile-casefiles/mobile.js','scripts/mobile-theme.py']:
  archive.write(root/name,arcname='case-files-mobile-update/'+name)
 archive.write(root/'docs/mobile-theme.md',arcname='case-files-mobile-update/MOBILE-THEME.md')
 archive.writestr('case-files-mobile-update/README.txt',readme)
print(destination)
