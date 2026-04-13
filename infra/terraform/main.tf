terraform {
  required_version = ">= 1.6"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.25" }
  }
}

variable "project_id" { type = string }
variable "region"     { type = string  default = "us-central1" }

provider "google" {
  project = var.project_id
  region  = var.region
}

# ---------- Enable required APIs ----------
locals {
  apis = [
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "firebase.googleapis.com",
    "fcm.googleapis.com",
  ]
}
resource "google_project_service" "apis" {
  for_each = toset(local.apis)
  service  = each.value
}

# ---------- Artifact Registry (container images) ----------
resource "google_artifact_registry_repository" "api" {
  location      = var.region
  repository_id = "cvs-health-rx"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# ---------- Cloud SQL (Postgres) ----------
resource "google_sql_database_instance" "pg" {
  name             = "cvs-health-rx-pg"
  database_version = "POSTGRES_15"
  region           = var.region
  settings {
    tier = "db-custom-1-3840"
    ip_configuration { ipv4_enabled = false }
    backup_configuration { enabled = true }
  }
  deletion_protection = false
  depends_on          = [google_project_service.apis]
}

resource "google_sql_database" "db" {
  name     = "cvsrx"
  instance = google_sql_database_instance.pg.name
}

resource "random_password" "db" { length = 24 special = true }

resource "google_sql_user" "api" {
  name     = "api"
  instance = google_sql_database_instance.pg.name
  password = random_password.db.result
}

# ---------- Secret Manager ----------
resource "google_secret_manager_secret" "db_conn" {
  secret_id = "DB_CONNECTION_STRING"
  replication { auto {} }
}
resource "google_secret_manager_secret_version" "db_conn_v" {
  secret      = google_secret_manager_secret.db_conn.id
  secret_data = "Host=/cloudsql/${google_sql_database_instance.pg.connection_name};Database=cvsrx;Username=api;Password=${random_password.db.result}"
}

# ---------- Cloud Run service ----------
resource "google_cloud_run_v2_service" "api" {
  name     = "cvs-health-rx-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.run_sa.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/cvs-health-rx/api:latest"
      ports { container_port = 8080 }
      env {
        name = "DB_CONNECTION_STRING"
        value_source { secret_key_ref { secret = google_secret_manager_secret.db_conn.secret_id  version = "latest" } }
      }
      env { name = "Gcp__ProjectId" value = var.project_id }
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance { instances = [google_sql_database_instance.pg.connection_name] }
    }
    scaling { min_instance_count = 0  max_instance_count = 20 }
  }
  depends_on = [google_project_service.apis]
}

resource "google_service_account" "run_sa" {
  account_id   = "cvs-health-rx-api"
  display_name = "CVS Health Rx API runtime"
}

resource "google_project_iam_member" "run_sa_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}
resource "google_project_iam_member" "run_sa_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}
resource "google_project_iam_member" "run_sa_fcm" {
  project = var.project_id
  role    = "roles/firebasemessaging.sender"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# Public invoker — in prod, swap for IAP or API Gateway.
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "api_url" { value = google_cloud_run_v2_service.api.uri }
