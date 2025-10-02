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

// Insights API functions
export const insightsApi = {
  getDailyInsight: async (userId: string, date?: string, force?: boolean) => {
    const params = new URLSearchParams({ user_id: userId });
    if (date) params.append('date', date);
    if (force) params.append('force', 'true');
    
    const response = await api.get(`/insights/daily?${params.toString()}`);
    return response.data;
  },

  getMonthlyInsight: async (userId: string, month?: string, force?: boolean) => {
    const params = new URLSearchParams({ user_id: userId });
    if (month) params.append('month', month);
    if (force) params.append('force', 'true');
    
    const response = await api.get(`/insights/monthly?${params.toString()}`);
    return response.data;
  }
};

// Alexa API functions for testing
export const alexaApi = {
  testCommand: async (command: string, userId: string) => {
    // Simulate Alexa intent based on command
    let intent = 'LaunchRequest';
    let slots: Record<string, string> = {};
    
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('add task') || lowerCommand.includes('complete task') || lowerCommand.includes('list my tasks')) {
      intent = 'TaskIntent';
      slots.freeText = command;
    } else if (lowerCommand.includes('log habit') || lowerCommand.includes('check habit streak')) {
      intent = 'HabitIntent';
      slots.freeText = command;
    } else if (lowerCommand.includes('add event') || lowerCommand.includes('what\'s my schedule')) {
      intent = 'ScheduleIntent';
      slots.freeText = command;
    } else if (lowerCommand.includes('daily briefing') || lowerCommand.includes('how am i doing')) {
      intent = 'SummaryIntent';
    }
    
    // Mock response based on intent
    return {
      speech: `Mock response for: "${command}"`,
      intent,
      slots,
      timestamp: new Date().toISOString()
    };
  }
};