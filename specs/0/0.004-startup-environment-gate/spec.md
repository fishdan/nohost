# Startup Environment Gate

## Goal

Give a fresh clone (human or AI) one command that checks whether the machine can develop, authenticate with clasp, and confirm the public Hello World page — and that prints the exact next steps when something is missing.

## Scope

This feature covers local environment gating and guided remediations. It does not change the Hello World page, production GitHub deployment, or Google Cloud bootstrap. Secrets remain untracked.

## Acceptance criteria

- `.nvmrc` contains a latest alias (`node`, `latest`, or `current`), not a pinned major version.
- CI and production workflows install Node with `node-version: latest` and then `npm install -g npm@latest` (setup-node’s bundled npm can lag npm’s current latest).
- `npm run doctor` (and `node scripts/doctor.mjs`) runs without installed project dependencies other than Node and npm.
- The doctor runs `npm doctor connection registry environment versions` so Node and npm must match npm’s current latest, plus registry, git, and PATH health.
- The doctor verifies git, `.nvmrc`, and `node_modules`.
- The doctor detects missing clasp credentials (`.secrets/.clasprc.json`), missing or placeholder `.clasp.json`, and a Hello World `/exec` URL that is not anonymously reachable.
- Failures print copy-paste remediations, including `nvm install node` and clasp login.
- `--fix` performs only safe local remediations (`npm install`, create `.secrets/`, copy `~/.clasprc.json` into the project). It never commits secrets, never runs interactive `clasp login`, and never deploys.
- `--ci` checks only the develop toolchain so GitHub Actions can run the gate without clasp secrets.
- `start.ai` runs the doctor during session startup and reports develop, deploy, and public Hello World status.
- Automated tests cover check logic and `--ci` success on a toolchain-ready checkout.
