import { announcements, defaultDrawState, students, type Announcement, type ScoreField, type Student } from "@/lib/classData";

export type DrawMode = "repeat" | "nonrepeat";

export type DrawHistoryEntry = {
  id: number;
  studentId: number;
  studentName: string;
  mode: DrawMode;
  drawAt: string;
};

export type DrawSession = {
  id: number;
  title: string;
  mode: DrawMode;
  queue: number[];
  history: DrawHistoryEntry[];
};

export type ClassroomState = {
  schoolName: string;
  className: string;
  teacherPasscode: string;
  students: Student[];
  announcements: Announcement[];
  drawSessions: DrawSession[];
  activeDrawId: number;
  updatedAt: string;
};

export type ClassroomAction =
  | { action: "updateBranding"; schoolName: string; className: string }
  | { action: "updateTeacherPasscode"; teacherPasscode: string }
  | { action: "updateScore"; studentId: number; field: ScoreField; delta: number }
  | { action: "updateRemark"; studentId: number; remark: string }
  | { action: "updateRole"; studentId: number; role: string }
  | { action: "addAnnouncement"; title: string; body: string; pinned?: boolean }
  | { action: "togglePinnedAnnouncement"; announcementId: number }
  | { action: "createDrawSession"; title: string; mode: DrawMode }
  | { action: "setActiveDraw"; sessionId: number }
  | { action: "runDraw"; sessionId: number }
  | { action: "undoDraw"; sessionId: number };

type ActionResult = {
  state: ClassroomState;
  meta?: {
    drawnStudentName?: string;
  };
};

function cloneState(state: ClassroomState): ClassroomState {
  return JSON.parse(JSON.stringify(state)) as ClassroomState;
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function computeOverall(student: Student): number {
  return student.academic + student.motivation + student.service + student.roleModel;
}

function normalizeStudents(input: Student[]): Student[] {
  return input.map((student) => ({
    ...student,
    overall: computeOverall(student),
  }));
}

function initialState(): ClassroomState {
  return {
    schoolName: "CWCC",
    className: "P6A",
    teacherPasscode: "1234",
    students: normalizeStudents(students),
    announcements: announcements,
    drawSessions: [
      {
        id: 1,
        title: "Main draw",
        mode: defaultDrawState.mode,
        queue: [...defaultDrawState.queue],
        history: [],
      },
    ],
    activeDrawId: 1,
    updatedAt: nowIso(),
  };
}

let inMemoryState: ClassroomState = initialState();

export function getClassroomState(): ClassroomState {
  return cloneState(inMemoryState);
}

function mutateState(mutator: (state: ClassroomState) => ActionResult | void): ActionResult {
  const working = cloneState(inMemoryState);
  const maybeResult = mutator(working);
  working.updatedAt = nowIso();
  inMemoryState = working;

  if (maybeResult) {
    return {
      state: cloneState(inMemoryState),
      meta: maybeResult.meta,
    };
  }

  return { state: cloneState(inMemoryState) };
}

export function applyClassroomAction(action: ClassroomAction): ActionResult {
  return mutateState((state) => {
    switch (action.action) {
      case "updateBranding": {
        state.schoolName = action.schoolName.trim() || state.schoolName;
        state.className = action.className.trim() || state.className;
        return;
      }

      case "updateTeacherPasscode": {
        state.teacherPasscode = action.teacherPasscode.trim() || state.teacherPasscode;
        return;
      }

      case "updateScore": {
        const target = state.students.find((student) => student.id === action.studentId);
        if (!target) return;

        const next = Math.max(0, (target[action.field] ?? 0) + action.delta);
        target[action.field] = next;
        target.overall = computeOverall(target);
        return;
      }

      case "updateRemark": {
        const target = state.students.find((student) => student.id === action.studentId);
        if (!target) return;
        target.remark = action.remark;
        return;
      }

      case "updateRole": {
        const target = state.students.find((student) => student.id === action.studentId);
        if (!target) return;
        target.role = action.role;
        return;
      }

      case "addAnnouncement": {
        const pinned = action.pinned ?? false;
        if (pinned) {
          state.announcements = state.announcements.map((announcement) => ({
            ...announcement,
            pinned: false,
          }));
        }
        state.announcements.unshift({
          id: Date.now(),
          title: action.title.trim(),
          body: action.body.trim(),
          pinned,
          date: nowDate(),
        });
        return;
      }

      case "togglePinnedAnnouncement": {
        state.announcements = state.announcements.map((announcement) => {
          if (announcement.id === action.announcementId) {
            return { ...announcement, pinned: !announcement.pinned };
          }
          return { ...announcement, pinned: false };
        });
        return;
      }

      case "createDrawSession": {
        const title = action.title.trim() || `Draw ${state.drawSessions.length + 1}`;
        const newSession: DrawSession = {
          id: Date.now(),
          title,
          mode: action.mode,
          queue: state.students.map((student) => student.id),
          history: [],
        };
        state.drawSessions.push(newSession);
        state.activeDrawId = newSession.id;
        return;
      }

      case "setActiveDraw": {
        const exists = state.drawSessions.some((session) => session.id === action.sessionId);
        if (exists) {
          state.activeDrawId = action.sessionId;
        }
        return;
      }

      case "runDraw": {
        const session = state.drawSessions.find((entry) => entry.id === action.sessionId);
        if (!session || session.queue.length === 0) return;

        const index = Math.floor(Math.random() * session.queue.length);
        const chosenId = session.queue[index];
        const chosenStudent = state.students.find((student) => student.id === chosenId);

        if (!chosenStudent) return;

        if (session.mode === "nonrepeat") {
          session.queue = session.queue.filter((id) => id !== chosenId);
        }

        session.history.push({
          id: Date.now(),
          studentId: chosenStudent.id,
          studentName: chosenStudent.engName,
          mode: session.mode,
          drawAt: nowIso(),
        });

        return {
          state,
          meta: { drawnStudentName: chosenStudent.engName },
        };
      }

      case "undoDraw": {
        const session = state.drawSessions.find((entry) => entry.id === action.sessionId);
        if (!session || session.history.length === 0) return;

        const last = session.history.pop();
        if (!last) return;

        if (session.mode === "nonrepeat" && !session.queue.includes(last.studentId)) {
          session.queue.push(last.studentId);
        }
        return;
      }

      default:
        return;
    }
  });
}
