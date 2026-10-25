# The pocket records room

The mobile experience preserves the Case Files identity while adapting the
archive and reading experience to touch. It uses the existing shared stylesheet
and script, so article content, feeds, canonical URLs and desktop layouts remain
in the current Publii format. No framework, database or per-post configuration
is needed.

At 820 CSS pixels and below:

- The full classification bulletin scrolls continuously. Its 44-pixel pause
  button remembers the reader's choice; reduced motion presents static,
  wrapping text. The duplicate used for the loop is hidden from screen readers.
- Category folders form a sticky, horizontally scrollable strip with native
  touch scrolling. The same navigation returns to the desktop header on resize.
- The archive has a compact introduction, readable folder cards, touch targets,
  and a bottom toolbar. Search reads the existing JSON feed on demand and
  filters it locally; no query or reading position is sent to a search service.
- Articles have a bottom reading toolbar, progress indicator, automatic section
  index, and three saved text sizes. Browser-native sharing has a selectable
  link fallback. Evidence images open in a full-screen viewer with fit/original
  size controls and native scrolling/zoom. Wide code and tables scroll inside
  the paper rather than widening the document.
- Native dialogs provide focus containment and Escape dismissal. Most content
  and navigation remain usable when JavaScript is disabled.

## Publishing and the missing local template

This repository contains Publii's **export**, not its editable Handlebars theme.
The editable theme wasn't found in the available workspace or connected code
search. Publii's GitHub uploader can remove remote files that aren't in the
local export and can replace the shared CSS/JS. Changes here therefore cannot,
by themselves, guarantee persistence across a publish from an old local theme.

The release includes a one-time update for the existing local Case Files theme.
After applying it, new posts inherit the mobile behaviour automatically through
the assets that Publii already includes on every page. The existing template
settings, layouts, content and publication workflow are preserved.

1. Back up the active local Case Files theme.
2. From the update bundle, merge `assets/css/main.css` and
   `assets/js/main.js` into that theme, replacing those two files. This is an
   asset update, not a complete replacement theme.
3. Publish normally through Publii. No changes to individual posts are needed.

Alternatively, apply the update to a theme folder with Python:

```sh
python3 scripts/mobile-theme.py /absolute/path/to/active-case-files-theme
```

The script requires both existing theme assets, adds one marked mobile block to
each, and saves `.before-mobile` backups when patching an external theme.
Re-running it replaces that block rather than duplicating it. It doesn't edit
Handlebars files. A copy of a template already updated with different local
changes can be patched this way without replacing its earlier CSS/JS.

For changes in this repository, edit `assets/mobile-casefiles/mobile.css` and
`mobile.js`, then run `python3 scripts/mobile-theme.py`. The current exported
asset references receive fresh content fingerprints. Future Publii exports
calculate their own fingerprints from the updated local theme.

## Local verification

```sh
python3 scripts/mobile-theme.py
python3 tests/test_theme_install.py
python3 scripts/preview.py --port 8793
# In another terminal with Playwright and Chromium available:
node tests/mobile-browser.cjs
python3 scripts/package-theme.py
```

The preview changes canonical-origin resource/navigation references only in the
HTTP response so local tests load local assets. It doesn't rewrite stored posts
or feeds. Browser tests cover every generated Case Files page at four widths,
bulletin controls/reduced motion, category scrolling, article sections and type
settings, image viewing, safe feed search and failure fallback, sharing fallback,
wide evidence in a newly generated post, desktop resize, and JavaScript-disabled
navigation. Physical Gecko/WebKit, the native share UI and actual keyboard
animation remain device checks. AMP and legacy templates remain separate.

The Pages middleware rewrites canonical-origin asset and navigation links only
on the project's branch preview hostnames. This makes the preview exercise its
own files. Public production responses pass through unchanged; the mobile
experience itself is in the patched shared assets, independent of middleware.
