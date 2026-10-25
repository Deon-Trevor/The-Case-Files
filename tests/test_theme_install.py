import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('theme',ROOT/'scripts/mobile-theme.py')
theme=importlib.util.module_from_spec(spec);spec.loader.exec_module(theme)
class ThemeInstall(unittest.TestCase):
 def test_install_is_repeatable_and_preserves_the_template(self):
  with tempfile.TemporaryDirectory() as tmp:
   target=Path(tmp);(target/'assets/css').mkdir(parents=True);(target/'assets/js').mkdir()
   css=target/'assets/css/main.css';js=target/'assets/js/main.js';hbs=target/'post.hbs'
   css.write_text('/* original theme */');js.write_text('/* original behaviour */');hbs.write_text('{{{post.text}}}')
   theme.install(target);first=(css.read_text(),js.read_text());theme.install(target)
   self.assertEqual(first,(css.read_text(),js.read_text()))
   self.assertEqual(css.read_text().count('CASE FILES MOBILE CSS START'),1)
   self.assertEqual(hbs.read_text(),'{{{post.text}}}')
   self.assertEqual(css.with_suffix('.css.before-mobile').read_text(),'/* original theme */')
   self.assertEqual(js.with_suffix('.js.before-mobile').read_text(),'/* original behaviour */')
 def test_missing_asset_does_not_partially_patch_a_theme(self):
  with tempfile.TemporaryDirectory() as tmp:
   target=Path(tmp);(target/'assets/css').mkdir(parents=True);css=target/'assets/css/main.css';css.write_text('original')
   with self.assertRaises(FileNotFoundError):theme.install(target)
   self.assertEqual(css.read_text(),'original')
 def test_exported_assets_match_the_shared_mobile_source(self):
  for kind in ['css','js']:
   output=(ROOT/f'assets/{kind}/main.{kind}').read_text()
   source=(ROOT/f'assets/mobile-casefiles/mobile.{kind}').read_text().strip()
   self.assertIn(source,output)
   self.assertEqual(output.count(f'CASE FILES MOBILE {kind.upper()} START'),1)
 def test_download_bundle_contains_the_tested_assets(self):
  with zipfile.ZipFile(ROOT/'downloads/case-files-mobile-theme-update.zip') as archive:
   for name in ['assets/css/main.css','assets/js/main.js','assets/mobile-casefiles/mobile.css','assets/mobile-casefiles/mobile.js','scripts/mobile-theme.py']:
    self.assertEqual(archive.read('case-files-mobile-update/'+name),(ROOT/name).read_bytes())
if __name__=='__main__':unittest.main()
