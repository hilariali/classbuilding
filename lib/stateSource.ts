import { applyClassroomAction, getClassroomState, type ClassroomAction, type ClassroomState } from "@/lib/state";

const scriptUrl = process.env.CLASSBUILDING_APPS_SCRIPT_URL;
const SCRIPT_GET_TIMEOUT_MS = 10000;
const SCRIPT_POST_TIMEOUT_MS = 8000;
const SCRIPT_GET_RETRIES = 1;
const SCRIPT_POST_RETRIES = 1;

type SourceResponse = {
  state: ClassroomState;
  meta?: {
    drawnStudentName?: string;
  };
  source: "apps-script" | "local-fallback";
  sourceError?: string;
};

function normalizeState(incoming: ClassroomState): ClassroomState {
  return {
    schoolName: incoming.schoolName || "CWCC",
    className: incoming.className || "P6A",
    teacherPasscode: incoming.teacherPasscode || "1234",
    students: incoming.students || [],
    announcements: incoming.announcements || [],
    drawSessions: incoming.drawSessions || [],
    activeDrawId: incoming.activeDrawId || 0,
    updatedAt: incoming.updatedAt || new Date().toISOString(),
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchScriptWithRetry(url: string, init: RequestInit, options: { timeoutMs: number; retries: number }) {
  let lastError: Error | null = null;
  const { timeoutMs, retries } = options;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);
      if (!response.ok) {
        throw new Error(`Apps Script request failed with ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Apps Script error");
      if (attempt === retries) {
        break;
      }
    }
  }

  throw lastError ?? new Error("Unknown Apps Script error");
}

export async function getStateFromSource(): Promise<SourceResponse> {
  if (!scriptUrl) {
    return {
      state: getClassroomState(),
      source: "local-fallback",
      sourceError: "CLASSBUILDING_APPS_SCRIPT_URL is not set",
    };
  }

  try {
    const response = await fetchScriptWithRetry(
      `${scriptUrl}?action=getState`,
      {
        method: "GET",
        cache: "no-store",
      },
      {
        timeoutMs: SCRIPT_GET_TIMEOUT_MS,
        retries: SCRIPT_GET_RETRIES,
      },
    );

    const data = (await response.json()) as { state?: ClassroomState; error?: string };
    if (data.error) {
      throw new Error(data.error);
    }
    if (!data.state) {
      throw new Error("Apps Script response missing state");
    }

    return { state: normalizeState(data.state), source: "apps-script" };
  } catch (error) {
    return {
      state: getClassroomState(),
      source: "local-fallback",
      sourceError: error instanceof Error ? error.message : "Unknown Apps Script error",
    };
  }
}

export async function postActionToSource(action: ClassroomAction): Promise<SourceResponse> {
  if (!scriptUrl) {
    const localResult = applyClassroomAction(action);
    return {
      state: localResult.state,
      meta: localResult.meta,
      source: "local-fallback",
      sourceError: "CLASSBUILDING_APPS_SCRIPT_URL is not set",
    };
  }

  try {
    const response = await fetchScriptWithRetry(
      scriptUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
        cache: "no-store",
      },
      {
        timeoutMs: SCRIPT_POST_TIMEOUT_MS,
        retries: SCRIPT_POST_RETRIES,
      },
    );

    const data = (await response.json()) as {
      state?: ClassroomState;
      meta?: { drawnStudentName?: string };
      error?: string;
    };

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.state) {
      throw new Error("Apps Script response missing state");
    }

    return { state: normalizeState(data.state), meta: data.meta, source: "apps-script" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Apps Script error";
    throw new Error(`Apps Script update failed: ${message}`);
  }
}
