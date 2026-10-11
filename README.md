# Auspicious date application

Open [擇日.html](./擇日.html) locally, or deploy the static application to
Cloudflare Workers.

## Cloudflare deployment

The Worker name is `auspicious-date`. The existing Cloudflare build can keep
its deploy command:

```sh
npx wrangler deploy
```

If Cloudflare has a separate build command configured, use `npm run build`.
The package manifest defines this command without adding dependencies:

```sh
npm run build
```

Wrangler runs `sh scripts/build-static.sh` before deployment. The script copies
the application into `dist/index.html` for the site root and `dist/擇日.html`
for the original named URL. Only `dist/` is uploaded; tests, repository files,
and the local Python environment are not published. A separate build command
is optional because Wrangler also runs the build; running both is safe.
No application dependencies are required.

To verify the asset upload configuration without deploying:

```sh
npx wrangler deploy --dry-run
```

## Browser data

Imported workbooks are stored in the browser, not in the deployment.
The Cloudflare HTTPS site has separate browser storage from a locally opened
file. Existing local imports do not automatically transfer to the hosted site.
The settings entry is currently hidden in the application.
