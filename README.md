# CVS Health Rx — Unified Pharmacy, Telehealth & EHR Platform

A hypothetical senior-level reference project demonstrating a merged Web + Mobile team stack:
**React Native (iOS/Android/Web)** frontend backed by a **C# .NET 8 Web API**, deployed to **Google Cloud Platform** via **Cloud Run + Cloud SQL (Postgres) + Firebase**.

Built to mirror the responsibilities of a Senior React Native engineer at a pharmacy/healthcare company: scalable architecture, cross-platform delivery, RESTful API integration, offline storage, performance tuning, and EHR integration patterns.

---

## Feature Modules

| Module | Description |
|---|---|
| **Prescription Refills & Reminders** | List active Rx, one-tap refill, push-notification reminders, offline caching |
| **Pharmacy Locator & Appointments** | Geolocated store search, book vaccine / MinuteClinic-style visits |
| **Telehealth Virtual Visits** | Schedule + join virtual consults (WebRTC session token issued by backend) |
| **EHR / Epic-style Records** | View lab results, allergies, visit history via FHIR-compatible contracts |

---

## Architecture

```
┌─────────────────────────────┐        ┌────────────────────────────────┐
│  React Native (iOS/Android) │        │  React Native Web (rn-web)     │
│  Redux Toolkit · RN Nav     │        │  same codebase · webpack build │
└──────────────┬──────────────┘        └──────────────┬─────────────────┘
               │  HTTPS / JSON (REST)                 │
               └────────────────┬─────────────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  Cloud Run (containers)      │
                 │  CvsHealthRx.Api (.NET 8)    │
                 │   · PrescriptionsController  │
                 │   · PharmaciesController     │
                 │   · TelehealthController     │
                 │   · EhrController (FHIR)     │
                 └──────┬──────────────┬────────┘
                        │              │
         ┌──────────────▼──┐       ┌───▼─────────────┐
         │ Cloud SQL       │       │ Firebase        │
         │ Postgres 15     │       │  · Auth (JWT)   │
         │ (patient data)  │       │  · FCM push     │
         └─────────────────┘       └─────────────────┘
```

Identity is delegated to **Firebase Auth**; the .NET API validates Firebase-issued JWTs. Push notifications (refill reminders, appointment reminders) go through **FCM**. Data persistence uses **Cloud SQL Postgres** via EF Core. Secrets live in **Secret Manager**, pulled at Cloud Run startup.

---

## Repo Layout

```
cvs-health-rx/
├── backend/CvsHealthRx.Api/      # .NET 8 Web API (C#)
├── mobile/CvsHealthRxApp/        # React Native (iOS/Android/Web)
├── infra/
│   ├── terraform/                # GCP IaC
│   ├── cloudbuild/               # Cloud Build pipelines
│   └── k8s/                      # optional GKE manifests
└── docs/                         # ADRs, API contracts
```

---

## Deploy to GCP — Quick Start

```bash
# 1. Set project
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login

# 2. Provision infra (Cloud SQL, Cloud Run service, Secret Manager, Artifact Registry)
cd infra/terraform
terraform init && terraform apply -var="project_id=YOUR_PROJECT_ID"

# 3. Build + deploy API
cd ../../backend
gcloud builds submit --config ../infra/cloudbuild/backend.yaml

# 4. Build mobile app
cd ../mobile/CvsHealthRxApp
npm install
npx react-native run-ios       # or run-android
npm run web                    # React Native Web build
```

Full walkthrough: [`docs/DEPLOY.md`](docs/DEPLOY.md).

---

## Senior-role alignment

- **React Native + RN Web** single codebase → serves the merged Web/Mobile team.
- **C# .NET 8** backend demonstrates some-C# requirement without making it the focus.
- **Scalable architecture**: stateless Cloud Run containers, managed Postgres, async FCM.
- **API contracts**: OpenAPI spec generated from controllers (`/swagger`).
- **Performance**: offline cache via MMKV, list virtualization, Hermes, lazy module loading.
- **Healthcare-aware**: FHIR-shaped EHR DTOs, HIPAA-minded logging (no PHI in logs).
- **AI-assisted dev**: see `docs/AI_TOOLING.md` for Copilot/Claude Code workflow notes.
