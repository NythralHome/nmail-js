# Release Checklist

Use this checklist before running the `Publish` workflow.

## Package

- `package.json` version is bumped intentionally.
- `CHANGELOG.md` has an entry for the release.
- `README.md` examples match the live Nmail API and dashboard docs.
- No API keys, tokens, customer emails, or test recipient lists are present.
- `npm test` passes locally and in GitHub Actions.
- `npm pack --dry-run` contains only `src/` and `README.md`.

## npm

- NPM package name: `@nythral/nmail`.
- Required GitHub secret: `NPM_TOKEN`.
- Publish workflow input `confirm_publish` must be exactly `publish-nmail-js`.
- Publish workflow input `version` must match `package.json`.

## Creating npm credentials

1. Sign in to `https://www.npmjs.com`.
2. Enable 2FA on the publishing account.
3. Create an automation access token for publishing.
4. Add it as the `NPM_TOKEN` GitHub repository secret for `NythralHome/nmail-js`.
5. Do not paste the token into chat, commits, issue comments, or workflow logs.

## Post-Release

- Verify package page is public.
- Install in a temporary project with `npm install @nythral/nmail`.
- Run a non-secret mocked test first.
- Ask Owen or Iris for one approved live Nmail API smoke send if needed.
