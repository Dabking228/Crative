import type {
  ApplyRequest,
  ApplicationQueueItem,
  ApplicationDetail,
  VerdictRequest,
  VerdictResponse,
  GraphData,
  MilestoneStatus,
  SSEToken,
} from './types';

// Empty string → relative /api/... calls → Next.js mock routes (no backend needed).
// Set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local to use the real Python backend.
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Application ──────────────────────────────────────────────────────────────

export async function submitApplication(data: ApplyRequest) {
  return request<{ application_id: string; status: string; message: string }>('/api/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getApplicationStatus(id: string) {
  return request<{
    application_id: string;
    status: string;
    eligibility_result: string | null;
    eligibility_reasoning: string;
    eligibility_flags: string[];
    eligibility_confidence: number | null;
    programme_recommended: string | null;
    startup_name: string | null;
    sector: string | null;
  }>(`/api/apply/${id}/status`);
}

export function streamGatekeeper(
  applicationId: string,
  onToken: (token: string) => void,
  onDone: (result: SSEToken['result']) => void,
  onError: (err: Error) => void
): () => void {
  const streamBase = BASE || window.location.origin;
  const es = new EventSource(`${streamBase}/api/apply/${applicationId}/stream`);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as SSEToken;
      if (data.done) {
        onDone(data.result);
        es.close();
      } else {
        onToken(data.token);
      }
    } catch {
      onError(new Error('Failed to parse SSE token'));
    }
  };

  es.onerror = () => {
    onError(new Error('SSE connection error'));
    es.close();
  };

  return () => es.close();
}

// ── Interview ────────────────────────────────────────────────────────────────

export async function generateInterview(applicationId: string) {
  return request<{ application_id: string; questions: string[]; count: number }>(
    `/api/interview/${applicationId}/generate`,
    { method: 'POST' }
  );
}

export async function submitInterview(applicationId: string, questions: string[], answers: string[]) {
  return request<{ application_id: string; status: string; message: string }>(
    `/api/interview/${applicationId}/submit`,
    { method: 'POST', body: JSON.stringify({ questions, answers }) }
  );
}

// ── Judge ────────────────────────────────────────────────────────────────────

export async function getJudgeQueue() {
  return request<{ applications: ApplicationQueueItem[] }>('/api/judge/queue');
}

export async function getJudgeDetail(applicationId: string) {
  return request<ApplicationDetail>(`/api/judge/${applicationId}`);
}

export async function submitVerdict(applicationId: string, data: VerdictRequest) {
  return request<VerdictResponse>(`/api/judge/${applicationId}/verdict`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Graph ────────────────────────────────────────────────────────────────────

export async function getEcosystemGraph() {
  return request<GraphData>('/api/graph/ecosystem');
}

// ── Milestone ────────────────────────────────────────────────────────────────

export async function uploadMilestone(
  applicationId: string,
  videoBase64: string,
  milestoneDescription: string,
  milestoneName: string
) {
  return request<MilestoneStatus>(`/api/milestone/${applicationId}/upload`, {
    method: 'POST',
    body: JSON.stringify({
      video_base64: videoBase64,
      milestone_description: milestoneDescription,
      milestone_name: milestoneName,
    }),
  });
}

export async function getMilestoneStatus(applicationId: string) {
  return request<MilestoneStatus>(`/api/milestone/${applicationId}/status`);
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function getHealth() {
  return request<{ status: string; vertex_ai: boolean; neo4j: boolean; timestamp: string }>(
    '/api/health'
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
