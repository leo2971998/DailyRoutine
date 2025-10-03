export type AIIntent =
  | 'task_improve'
  | 'habit_improve'
  | 'schedule_optimize'
  | 'dashboard_plan';

export type AIPatchRef = {
  endpoint: string;
  method?: 'PATCH' | 'POST' | 'PUT';
  body?: Record<string, unknown>;
};

export type AISuggestion = {
  title: string;
  diff?: Record<string, unknown>;
  explanation?: string;
  apply_patch: AIPatchRef;
};

export type AISuggestResponse = {
  suggestions: AISuggestion[];
};

export async function aiSuggest(baseUrl: string, payload: unknown): Promise<AISuggestResponse> {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/ai/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`AI suggest failed: ${res.status}`);
  }

  return res.json();
}
