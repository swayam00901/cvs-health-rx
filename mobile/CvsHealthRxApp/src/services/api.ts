import axios, { AxiosInstance } from 'axios';
import auth from '@react-native-firebase/auth';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const BASE_URL = process.env.API_BASE_URL || 'https://cvs-health-rx-api-xxx.run.app';

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });

  client.interceptors.request.use(async (config) => {
    const token = await auth().currentUser?.getIdToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Offline cache for GET requests — last-known-good response per URL.
  client.interceptors.response.use(
    (resp) => {
      if (resp.config.method === 'get') {
        storage.set(`cache:${resp.config.url}`, JSON.stringify(resp.data));
      }
      return resp;
    },
    (err) => {
      if (err.config?.method === 'get') {
        const cached = storage.getString(`cache:${err.config.url}`);
        if (cached) return Promise.resolve({ ...err, data: JSON.parse(cached), fromCache: true });
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export const api = createClient();

export const PrescriptionsApi = {
  list: (patientId: string) => api.get(`/api/patients/${patientId}/prescriptions`).then((r) => r.data),
  refill: (patientId: string, rxId: string) =>
    api.post(`/api/patients/${patientId}/prescriptions/${rxId}/refill`).then((r) => r.data),
};

export const PharmaciesApi = {
  nearby: (lat: number, lon: number, radiusKm = 10) =>
    api.get(`/api/pharmacies/nearby`, { params: { lat, lon, radiusKm } }).then((r) => r.data),
  book: (payload: {
    patientId: string;
    pharmacyId: string;
    kind: 'Vaccine' | 'MinuteClinic' | 'PharmacistConsult';
    startsAt: string;
    notes?: string;
  }) => api.post(`/api/pharmacies/appointments`, payload).then((r) => r.data),
};

export const TelehealthApi = {
  schedule: (payload: { patientId: string; providerName: string; scheduledAt: string }) =>
    api.post(`/api/telehealth/visits`, payload).then((r) => r.data),
  join: (visitId: string) => api.post(`/api/telehealth/visits/${visitId}/join`).then((r) => r.data),
};

export const EhrApi = {
  records: (patientId: string, resourceType?: string) =>
    api.get(`/api/patients/${patientId}/ehr`, { params: { resourceType } }).then((r) => r.data),
};
