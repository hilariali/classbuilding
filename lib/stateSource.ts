import { applyClassroomAction, getClassroomState, type ClassroomAction, type ClassroomState } from "@/lib/state";

const scriptUrl = process.env.CLASSBUILDING_APPS_SCRIPT_URL;
const SCRIPT_FETCH_TIMEOUT_MS = 8000;

type SourceResponse = {
  state: ClassroomState;
  meta?: {
    drawnStudentName?: string;
  };
  source: "apps-script" | "local-fallback";
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

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCRIPT_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getStateFromSource(): Promise<SourceResponse> {
  if (!scriptUrl) {
    return { state: getClassroomState(), source: "local-fallback" };
  }

  try {
    const response = await fetchWithTimeout(`${scriptUrl}?action=getState`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Apps Script getState failed with ${response.status}`);
    }

    const data = (await response.json()) as { state?: ClassroomState };
    if (!data.state) {
      throw new Error("Apps Script response missing state");
    }

    return { state: normalizeState(data.state), source: "apps-script" };
  } catch {
    return { state: getClassroomState(), source: "local-fallback" };
  }
}

export async function postActionToSource(action: ClassroomAction): Promise<SourceResponse> {
  if (!scriptUrl) {
    const localResult = applyClassroomAction(action);
    return {
      state: localResult.state,
      meta: localResult.meta,
      source: "local-fallback",
    };
  }

  try {
    const response = await fetchWithTimeout(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Apps Script post action failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      state?: ClassroomState;
      meta?: { drawnStudentName?: string };
    };

    if (!data.state) {
      throw new Error("Apps Script response missing state");
    }

    return { state: normalizeState(data.state), meta: data.meta, source: "apps-script" };
  } catch {
    const localResult = applyClassroomAction(action);
    return {
      state: localResult.state,
      meta: localResult.meta,
      source: "local-fallback",
    };
  }
}
