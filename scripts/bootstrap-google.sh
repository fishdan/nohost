#!/usr/bin/env bash
set -euo pipefail

# Safe, parameterized Cloud setup. Never stores credentials or deploys blindly.
PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-}"
REGION="${GOOGLE_CLOUD_REGION:-global}"
POOL_ID="${GOOGLE_WORKLOAD_IDENTITY_POOL_ID:-github}"
PROVIDER_ID="${GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID:-google-apps}"
REPOSITORY="${GITHUB_REPOSITORY:-fishdan/googleApps}"
SERVICE_ACCOUNT="${GOOGLE_DEPLOY_SERVICE_ACCOUNT:-clasp-deploy}"

if [[ -z "$PROJECT_ID" ]]; then echo "Set GOOGLE_CLOUD_PROJECT_ID first." >&2; exit 1; fi
command -v gcloud >/dev/null || { echo "gcloud is required." >&2; exit 1; }

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable script.googleapis.com serviceusage.googleapis.com drive.googleapis.com iamcredentials.googleapis.com
gcloud iam service-accounts create "$SERVICE_ACCOUNT" --project="$PROJECT_ID" --display-name="Apps Script deployer" 2>/dev/null || echo "Service account already exists."
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud iam workload-identity-pools create "$POOL_ID" --project="$PROJECT_ID" --location="$REGION" --display-name="GitHub Actions" 2>/dev/null || echo "Workload identity pool already exists."
POOL_NAME="$(gcloud iam workload-identity-pools describe "$POOL_ID" --project="$PROJECT_ID" --location="$REGION" --format='value(name)')"
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" --project="$PROJECT_ID" --location="$REGION" --workload-identity-pool="$POOL_ID" --display-name="googleApps GitHub provider" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" --attribute-condition="assertion.repository == '${REPOSITORY}' && assertion.ref == 'refs/heads/main'" 2>/dev/null || echo "OIDC provider already exists."
gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/${POOL_NAME}/attribute.repository/${REPOSITORY}"
PROVIDER_NAME="$(gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" --project="$PROJECT_ID" --location="$REGION" --workload-identity-pool="$POOL_ID" --format='value(name)')"

cat <<EOF

Google Cloud bootstrap complete.
Set these GitHub Actions variables in the production environment:
  GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID
  GOOGLE_WORKLOAD_IDENTITY_PROVIDER=$PROVIDER_NAME
  GOOGLE_DEPLOY_SERVICE_ACCOUNT=$SERVICE_ACCOUNT_EMAIL

Still required manually:
  1. Enable the Apps Script API in Apps Script user settings:
     https://script.google.com/home/usersettings
  2. Create/connect the Apps Script project with clasp and copy its script ID
     into a local .clasp.json based on .clasp.json.example.
  3. Share the Apps Script project with $SERVICE_ACCOUNT_EMAIL as Editor.
     Service accounts cannot own Apps Script projects.
  4. Create/review the first web-app deployment and save its ID as
     CLASP_DEPLOYMENT_ID in the production environment.
EOF
