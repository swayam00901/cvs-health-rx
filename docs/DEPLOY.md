# Deploying CVS Health Rx to GCP

## Prereqs
- `gcloud`, `terraform`, `docker`, `node >= 20`, `dotnet-sdk-8.0`
- A GCP project with billing enabled
- A Firebase project (can share the same GCP project)

## 1. Provision infrastructure (Terraform)

```bash
cd infra/terraform
terraform init
terraform apply -var="project_id=YOUR_PROJECT_ID"
```

This provisions:
- Artifact Registry repo `cvs-health-rx`
- Cloud SQL Postgres 15 instance + `cvsrx` database
- Secret Manager secret `DB_CONNECTION_STRING`
- Cloud Run service `cvs-health-rx-api` (min=0, max=20)
- Service account with `cloudsql.client`, `secretmanager.secretAccessor`, `firebasemessaging.sender`

## 2. Configure Firebase

```bash
firebase projects:addfirebase YOUR_PROJECT_ID
firebase apps:create ios   com.cvs.healthrx
firebase apps:create android com.cvs.healthrx
firebase apps:create web   cvs-health-rx-web
```

Download the generated `google-services.json` / `GoogleService-Info.plist` / firebaseConfig and drop into:
- `mobile/CvsHealthRxApp/android/app/google-services.json`
- `mobile/CvsHealthRxApp/ios/GoogleService-Info.plist`
- `mobile/CvsHealthRxApp/src/services/firebaseConfig.ts` (web)

## 3. Build + deploy backend

```bash
gcloud builds submit --config infra/cloudbuild/backend.yaml
```

Verify:
```bash
curl "$(gcloud run services describe cvs-health-rx-api --region=us-central1 --format='value(status.url)')/healthz"
```

## 4. Build mobile app

```bash
cd mobile/CvsHealthRxApp
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android

# Web (served via Firebase Hosting or any static host)
npm run web:build
firebase deploy --only hosting
```

Point the app at your API URL by setting `API_BASE_URL` in `.env`.

## 5. Observability

- **Logs:** Cloud Logging → resource = `cloud_run_revision`
- **Metrics:** Cloud Monitoring dashboards for request latency, instance count
- **Error tracking:** Sentry (recommended, not included in scaffold)
- **Uptime:** Cloud Monitoring uptime check against `/healthz`

## 6. Security notes

- No PHI should ever hit Cloud Logging — Serilog config scrubs request bodies.
- For production, replace the public `allUsers` invoker with IAP or API Gateway.
- Enable VPC-SC and private IP on Cloud SQL before go-live.
- Rotate `DB_CONNECTION_STRING` via Secret Manager versioning (no redeploy required — Cloud Run reads `latest`).
