# Release workflow

Repository: `YesterdaysLemon/between-worlds`, branch `main`.
Public URL: https://between-worlds.alirezaafshan.com/

The GitHub Actions workflow tests the mathematical core, builds the web app, builds its Linux image, and runs HTTP smoke checks against that image. Pull requests validate only. Pushes to main and manual runs on main notify Deploy Manager when the `DEPLOY_ENABLED` repository variable is `true`.

The signed request names the exact Git commit. CI waits for its receipt to reach a successful terminal state. Deploy Manager fetches that exact branch tip, builds the image, checks a candidate container, promotes it, and checks production. Later releases retain the previous image for rollback; the first release has no previous image. Promotion can have a brief cutover gap.

The image serves `/healthz` and `/build.json` with the commit SHA and asset manifest, without caching. Hashed assets have immutable caching. Missing assets return 404. The simulation and its state stay in the browser; there is no application database or runtime API credential.

```sh
npm ci
npm run check
docker build -t between-worlds:check .
docker run --rm -p 127.0.0.1:8080:8080 between-worlds:check
node scripts/smoke.mjs http://127.0.0.1:8080 "$(git rev-parse HEAD)"
```

The initial app registration is additive: dedicated checkout `/opt/between-worlds/app`, owner `deploy-manager`, production loopback port 3150, candidate 3151, container 8080, health `/healthz`. Existing root deployment wrappers and service policy are reused.

GitHub secret names are `DEPLOY_WEBHOOK_URL` and `DEPLOY_WEBHOOK_SECRET`. The matching VPS secret name is `BETWEEN_WORLDS_DEPLOY_WEBHOOK_SECRET`. Values are never committed. A setup review bundle and host receipts are kept outside version control under `output/deployment/`.

After a release, verify the Actions result, terminal Deploy Manager receipt, exact public `/healthz` SHA, asset smoke checks, and desktop/mobile browser behavior. Local tests alone do not establish a live release.
