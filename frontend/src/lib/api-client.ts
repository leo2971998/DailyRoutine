import axios from 'axios';
import { env } from './env';

const API_PREFIX = '/v1';

const removeTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const normalizeBaseUrl = (value: string) => {
  const trimmed = removeTrailingSlashes(value.trim());
  if (!trimmed) {
    return 'http://localhost:8000';
  }

  if (trimmed.endsWith(API_PREFIX)) {
    const withoutPrefix = removeTrailingSlashes(
      trimmed.slice(0, -API_PREFIX.length)
    );
    return withoutPrefix || trimmed;
  }

  return trimmed;
};

const isAbsoluteUrl = (value: string) => /^[a-z][a-z0-9+.-]*:/.test(value);

export const api = axios.create({
  baseURL: normalizeBaseUrl(env.API_URL),
});

api.interceptors.request.use((config) => {
  if (typeof config.url === 'string' && !isAbsoluteUrl(config.url)) {
    const normalizedPath = config.url.startsWith('/')
      ? config.url
      : `/${config.url}`;

    if (
      normalizedPath === API_PREFIX ||
      normalizedPath.startsWith(`${API_PREFIX}/`)
    ) {
      config.url = normalizedPath;
    } else {
      config.url = `${API_PREFIX}${normalizedPath}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
