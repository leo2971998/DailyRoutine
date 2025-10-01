import axios from 'axios';
import { env } from './env';

export const api = axios.create({
  baseURL: env.API_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
