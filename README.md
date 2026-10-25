# [Sync_Pundit's Blog](https://github.com/Deon-Trevor/Sync_Pundit-Blog)

<a href="https://github.com/Deon-Trevor/Sync_Pundit-Blog">

![](https://github.com/Deon-Trevor/Github-Stats/blob/master/generated/overview.svg)
![](https://github.com/Deon-Trevor/Github-Stats/blob/master/generated/languages.svg)

</a>

This is where i host my blog. Feel free to contribute ideas and whatnot

Resume lives at [Sync_Pundit](https://github.com/Deon-Trevor/Sync_Pundit)

The [mobile Case Files layer](docs/mobile-theme.md) lives in shared theme assets,
so new articles use the same reading controls. This repository is a Publii export;
apply the [one-time theme asset update](downloads/case-files-mobile-theme-update.zip)
to the active local Publii theme before the next publish so it persists.

## Worker migration preview

`wrangler.worker.toml` defines a separate `sync-pundit-blog-worker-preview`
Worker. Pages and the blog custom domains remain in place. On a case-sensitive
checkout, run `node scripts/build-worker-assets.mjs`,
`node --test test/worker-preview.test.mjs`, then
`npx wrangler@4.151.3 deploy --config wrangler.worker.toml --dry-run` to check the
candidate. The asset build excludes repository tooling and checks for media names
that collide on case-insensitive filesystems. The Worker serves the Publii export
and preserves the Pages preview link rewrite on `workers.dev` previews.

Before any cutover, compare the Worker preview with the current Pages site for
article routes, media, feeds, downloads, custom 404s, and both mirror domains.
Move the custom domains only after those checks pass, then retire Pages.
