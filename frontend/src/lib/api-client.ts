import axios from 'axios';
import { env } from './env';

const buildBaseUrl = () => {
  const sanitized = env.API_URL.replace(/\/$/, '');
  return sanitized.endsWith('/v1') ? sanitized : `${sanitized}/v1`;
};

export const api = axios.create({
  baseURL: buildBaseUrl(),
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
