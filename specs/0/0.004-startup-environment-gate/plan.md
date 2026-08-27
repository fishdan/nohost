# Plan

1. Keep `npm run doctor` as `scripts/doctor.mjs`. Track latest Node via `.nvmrc` (`node`) and GitHub Actions `node-version: latest` — no pinned major.
2. Run `npm doctor connection registry environment versions`, then project checks (git, `node_modules`, clasp credentials, script ID, public Hello World).
3. Print PASS/FAIL/WARN/SKIP with remediations; support `--fix` and `--ci`.
4. Point `start.ai` and the README at the doctor as the session and fresh-clone gate.
5. Run the develop subset in CI after `npm ci`.
6. Add unit tests plus an integration check that `--ci` exits 0 when the latest toolchain is present.
