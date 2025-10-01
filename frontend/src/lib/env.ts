const resolveApiUrl = () => {
  const rawUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    (import.meta.env.VITE_API_BASE_URL as string | undefined);

  if (!rawUrl || rawUrl.trim().length === 0) {
    return 'http://localhost:8000';
  }

  return rawUrl;
};

export const env = {
  API_URL: resolveApiUrl(),
  DEMO_USER_ID: import.meta.env.VITE_DEMO_USER_ID as string,
};
