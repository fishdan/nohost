# Startup permission gates

## Goal

Make `start.ai` tell any AI assistant when it must obtain the human's explicit permission before remediating first-run problems.

## Scope

Startup instructions and their automated documentation test only. No web-app, deployment, credential, or infrastructure changes.

## Acceptance criteria

- `start.ai` permits read-only diagnostics and safe repository-local checks without confirmation.
- It requires explicit human permission before tool installation or upgrade, credential authentication, external Apps Script project creation, and deployment or publication.
- It distinguishes a browser click, which always requires human action, from an AI action that additionally needs approval.
- Tests preserve the permission-gate wording.
