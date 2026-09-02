"use client";

import { useEffect, useMemo, useState } from "react";
import { scoreRules, type ScoreField } from "@/lib/classData";
import type { ClassroomAction, ClassroomState, DrawMode } from "@/lib/state";

type ViewMode = "student" | "teacher";
type ScoreboardView = "overall" | "aspects";

type ApiResponse = {
  state?: ClassroomState;
  meta?: {
    drawnStudentName?: string;
  };
  error?: string;
};

const scoreOptions: Array<{ label: string; field: ScoreField }> = [
  { label: "Academic", field: "academic" },
  { label: "Learning motivation", field: "motivation" },
  { label: "Service", field: "service" },
  { label: "Role model", field: "roleModel" },
];

const quickActions: Array<{ label: string; field: ScoreField; delta: number }> = [
  { label: "Academic quiz or full-mark assignment +2", field: "academic", delta: 2 },
  { label: "Academic exam 70+ +10", field: "academic", delta: 10 },
  { label: "Academic exam 60-69 +5", field: "academic", delta: 5 },
  { label: "Learning motivation presentation +5", field: "motivation", delta: 5 },
  { label: "Learning motivation post sharing +2", field: "motivation", delta: 2 },
  { label: "Service help teacher +1", field: "service", delta: 1 },
  { label: "Service help peer +1", field: "service", delta: 1 },
  { label: "CWCC role model behavior +1", field: "roleModel", delta: 1 },
];

function totalScore(student: ClassroomState["students"][number]) {
  return student.academic + student.motivation + student.service + student.roleModel;
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type Props = {
  initialState: ClassroomState;
  appsScriptCode: string;
};

export default function ClassroomClient({ initialState, appsScriptCode }: Props) {
  const [state, setState] = useState<ClassroomState>(initialState);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("student");
  const [scoreboardView, setScoreboardView] = useState<ScoreboardView>("overall");
  const [aspectView, setAspectView] = useState<ScoreField>("academic");

  const [selectedStudentId, setSelectedStudentId] = useState<number>(initialState.students[0]?.id ?? 1);
  const [selectedField, setSelectedField] = useState<ScoreField>("academic");
  const [scoreDelta, setScoreDelta] = useState(1);
  const [roleDraft, setRoleDraft] = useState(initialState.students[0]?.role ?? "");
  const [remarkDraft, setRemarkDraft] = useState(initialState.students[0]?.remark ?? "");

  const [schoolNameDraft, setSchoolNameDraft] = useState(initialState.schoolName);
  const [classNameDraft, setClassNameDraft] = useState(initialState.className);
  const [teacherPasscodeDraft, setTeacherPasscodeDraft] = useState(initialState.teacherPasscode);

  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [pinMessage, setPinMessage] = useState(false);

  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);

  const [drawTitle, setDrawTitle] = useState("Class draw");
  const [drawMode, setDrawMode] = useState<DrawMode>("repeat");
  const [latestDrawName, setLatestDrawName] = useState("No draw yet");

  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerRunning]);

  const applyAction = async (action: ClassroomAction) => {
    setSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.state) {
        throw new Error(result.error ?? "Unable to save update");
      }

      setState(result.state);
      if (result.meta?.drawnStudentName) {
        setLatestDrawName(result.meta.drawnStudentName);
      }

      const selected = result.state.students.find((student) => student.id === selectedStudentId);
      if (selected) {
        setRoleDraft(selected.role);
        setRemarkDraft(selected.remark);
      }

      setSchoolNameDraft(result.state.schoolName);
      setClassNameDraft(result.state.className);
      setTeacherPasscodeDraft(result.state.teacherPasscode);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save update");
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = useMemo(
    () => state.students.find((student) => student.id === selectedStudentId) ?? state.students[0] ?? null,
    [selectedStudentId, state],
  );

  const activeDraw = useMemo(
    () => state.drawSessions.find((session) => session.id === state.activeDrawId) ?? state.drawSessions[0] ?? null,
    [state],
  );

  const pinnedAnnouncement = useMemo(
    () => state.announcements.find((item) => item.pinned) ?? state.announcements[0] ?? null,
    [state],
  );

  const topOverall = useMemo(
    () => [...state.students].sort((a, b) => totalScore(b) - totalScore(a)).slice(0, 10),
    [state],
  );

  const topAspect = useMemo(
    () => [...state.students].sort((a, b) => (b[aspectView] ?? 0) - (a[aspectView] ?? 0)).slice(0, 10),
    [state, aspectView],
  );

  const podium = (scoreboardView === "overall" ? topOverall : topAspect).slice(0, 3);
  const leaderboardRest = (scoreboardView === "overall" ? topOverall : topAspect).slice(3);

  const switchStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    const student = state.students.find((entry) => entry.id === studentId);
    if (student) {
      setRoleDraft(student.role);
      setRemarkDraft(student.remark);
    }
  };

  const openTeacherView = () => {
    if (teacherUnlocked) {
      setViewMode("teacher");
      return;
    }

    if (passcodeInput === state.teacherPasscode) {
      setTeacherUnlocked(true);
      setPasscodeError("");
      setPasscodeInput("");
      setViewMode("teacher");
      return;
    }

    setPasscodeError("Wrong passcode. Please ask your teacher.");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{state.schoolName}</p>
          <h1>{state.className} Class Building Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <button className={viewMode === "student" ? "primary-button" : "secondary-button"} onClick={() => setViewMode("student")}>
            Student View
          </button>
          <button className={viewMode === "teacher" ? "primary-button" : "secondary-button"} onClick={openTeacherView}>
            Teacher View
          </button>
        </div>
      </header>

      <section className="announcement-banner">
        <strong>Pinned announcement:</strong>{" "}
        {pinnedAnnouncement ? `${pinnedAnnouncement.title} - ${pinnedAnnouncement.body}` : "No announcement yet"}
      </section>

      {!teacherUnlocked && (
        <section className="panel lock-panel">
          <div className="panel-header"><h2>Teacher passcode</h2></div>
          <div className="passcode-grid">
            <input
              type="password"
              value={passcodeInput}
              onChange={(event) => setPasscodeInput(event.target.value)}
              placeholder="Enter teacher passcode"
            />
            <button className="primary-button" onClick={openTeacherView}>Unlock Teacher View</button>
          </div>
          {passcodeError && <p className="error-banner inline-error">{passcodeError}</p>}
        </section>
      )}

      {errorMessage && <p className="error-banner">{errorMessage}</p>}
      {saving && <p className="saving-banner">Saving updates...</p>}

      {viewMode === "student" ? (
        <section className="dashboard-grid">
          <article className="panel large-panel">
            <div className="panel-header">
              <h2>Top 10 Leaderboard</h2>
              <div className="panel-inline-actions">
                <button className={scoreboardView === "overall" ? "tiny-button active" : "tiny-button"} onClick={() => setScoreboardView("overall")}>Overall</button>
                <button className={scoreboardView === "aspects" ? "tiny-button active" : "tiny-button"} onClick={() => setScoreboardView("aspects")}>By aspect</button>
                {scoreboardView === "aspects" && (
                  <select value={aspectView} onChange={(event) => setAspectView(event.target.value as ScoreField)}>
                    {scoreOptions.map((option) => (
                      <option key={option.field} value={option.field}>{option.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="podium-grid">
              {podium.map((student, index) => (
                <div key={student.id} className={`podium-card place-${index + 1}`}>
                  <div className="podium-rank">#{index + 1}</div>
                  <h3>{student.engName}</h3>
                  <p>{student.role}</p>
                  <strong>{scoreboardView === "overall" ? totalScore(student) : student[aspectView]}</strong>
                </div>
              ))}
            </div>

            <div className="scoreboard-list fancy-list">
              {leaderboardRest.map((student, index) => (
                <div className="student-row" key={student.id}>
                  <div className="rank">#{index + 4}</div>
                  <div className="student-name">
                    <strong>{student.engName}</strong>
                    <small>{student.role}</small>
                  </div>
                  <div className="score-pill">{scoreboardView === "overall" ? totalScore(student) : student[aspectView]}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header"><h2>Student roles</h2></div>
            <ul className="role-list">
              {state.students.map((student) => (
                <li key={student.id}><span>{student.engName}</span><strong>{student.role}</strong></li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="panel-header"><h2>Messages</h2></div>
            <div className="message-list">
              {state.announcements.map((item) => (
                <article className="message" key={item.id}>
                  <div className="message-meta">
                    <strong>{item.title}</strong>
                    {item.pinned && <span className="pin-tag">Pinned</span>}
                  </div>
                  <p>{item.body}</p>
                  <small>{item.date}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="panel-header"><h2>Name list</h2></div>
            <div className="student-table-wrap">
              <table>
                <thead>
                  <tr><th>No.</th><th>Chi name</th><th>Other name</th><th>Eng Name</th><th>Reg. No.</th><th>House</th><th>Gender</th></tr>
                </thead>
                <tbody>
                  {state.students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.no}</td><td>{student.chiName}</td><td>{student.otherName}</td><td>{student.engName}</td><td>{student.regNo}</td><td>{student.house}</td><td>{student.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      ) : (
        <section className="dashboard-grid">
          <article className="panel wide-panel">
            <div className="panel-header"><h2>Class branding and teacher passcode</h2></div>
            <div className="branding-grid">
              <input value={schoolNameDraft} onChange={(event) => setSchoolNameDraft(event.target.value)} placeholder="School name" />
              <input value={classNameDraft} onChange={(event) => setClassNameDraft(event.target.value)} placeholder="Class name" />
              <button className="secondary-button" onClick={() => applyAction({ action: "updateBranding", schoolName: schoolNameDraft, className: classNameDraft })}>Save branding</button>
              <input type="password" value={teacherPasscodeDraft} onChange={(event) => setTeacherPasscodeDraft(event.target.value)} placeholder="Teacher passcode" />
              <button className="secondary-button" onClick={() => applyAction({ action: "updateTeacherPasscode", teacherPasscode: teacherPasscodeDraft })}>Save passcode</button>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="panel-header"><h2>Google spreadsheet setup + Apps Script code</h2></div>
            <p className="muted-text">Follow this checklist once, then your class data will persist in Google Sheets.</p>
            <ol className="setup-steps">
              <li>
                Create or open your target Google Sheet.
                <div className="muted-text">Copy the Sheet ID from the URL between /d/ and /edit.</div>
              </li>
              <li>
                In Apps Script, paste the full code shown below and save.
              </li>
              <li>
                Run <strong>setSpreadsheetId(&quot;YOUR_SHEET_ID&quot;)</strong> once in Apps Script.
              </li>
              <li>
                Run <strong>setupTemplate()</strong> once to create tabs + sample rows.
              </li>
              <li>
                Deploy Apps Script as Web App:
                <div className="muted-text">Execute as: Me, Who has access: Anyone with the link.</div>
              </li>
              <li>
                Copy the Web App URL and set it in your local environment:
              </li>
            </ol>
            <pre className="code-block">{`CLASSBUILDING_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-deployment-id/exec`}</pre>
            <p className="muted-text">For local test: put this value in .env.local and restart npm run dev.</p>

            <h3 className="setup-title">Set environment variable on Vercel (UI)</h3>
            <ol className="setup-steps">
              <li>Open your project in Vercel dashboard.</li>
              <li>Go to Settings -&gt; Environment Variables.</li>
              <li>Add variable name: <strong>CLASSBUILDING_APPS_SCRIPT_URL</strong>.</li>
              <li>Paste your Apps Script Web App URL as the value.</li>
              <li>Select environments: Production (and Preview/Development if needed).</li>
              <li>Save, then redeploy the project.</li>
            </ol>
            <details className="script-details" open>
              <summary>Show exact Apps Script code (same as docs/apps-script-backend.gs)</summary>
              <pre className="code-block">{appsScriptCode}</pre>
              <p className="muted-text">The view now loads this exact code from the docs file, so both are always identical.</p>
            </details>
          </article>

          <article className="panel large-panel">
            <div className="panel-header"><h2>Teacher scoring and role update</h2></div>
            <div className="score-editor">
              <select value={selectedStudentId} onChange={(event) => switchStudent(Number(event.target.value))}>
                {state.students.map((student) => (<option key={student.id} value={student.id}>{student.engName}</option>))}
              </select>
              <select value={selectedField} onChange={(event) => setSelectedField(event.target.value as ScoreField)}>
                {scoreOptions.map((option) => (<option key={option.field} value={option.field}>{option.label}</option>))}
              </select>
              <input type="number" value={scoreDelta} onChange={(event) => setScoreDelta(Number(event.target.value) || 1)} />
              <button className="primary-button" onClick={() => applyAction({ action: "updateScore", studentId: selectedStudentId, field: selectedField, delta: Math.abs(scoreDelta) })}>Add</button>
              <button className="secondary-button" onClick={() => applyAction({ action: "updateScore", studentId: selectedStudentId, field: selectedField, delta: -Math.abs(scoreDelta) })}>Remove</button>
            </div>

            <div className="quick-actions">
              {quickActions.map((actionItem, index) => (
                <button key={`${actionItem.label}-${index}`} className="tiny-button" onClick={() => applyAction({ action: "updateScore", studentId: selectedStudentId, field: actionItem.field, delta: actionItem.delta })}>{actionItem.label}</button>
              ))}
            </div>

            {selectedStudent && (
              <div className="student-card">
                <h3>{selectedStudent.engName}</h3>
                <div className="metric-grid">
                  <div><span>Academic</span><strong>{selectedStudent.academic}</strong></div>
                  <div><span>Learning motivation</span><strong>{selectedStudent.motivation}</strong></div>
                  <div><span>Service</span><strong>{selectedStudent.service}</strong></div>
                  <div><span>Role model</span><strong>{selectedStudent.roleModel}</strong></div>
                  <div className="highlight"><span>Overall</span><strong>{totalScore(selectedStudent)}</strong></div>
                </div>

                <div className="row-form">
                  <input value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} placeholder="Student role" />
                  <button className="secondary-button" onClick={() => applyAction({ action: "updateRole", studentId: selectedStudent.id, role: roleDraft })}>Save role</button>
                </div>

                <label className="remark-box">
                  <span>Remark</span>
                  <textarea value={remarkDraft} rows={3} onChange={(event) => setRemarkDraft(event.target.value)} />
                </label>
                <button className="secondary-button" onClick={() => applyAction({ action: "updateRemark", studentId: selectedStudent.id, remark: remarkDraft })}>Save remark</button>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-header"><h2>Announcement management</h2></div>
            <div className="composer">
              <input value={messageTitle} onChange={(event) => setMessageTitle(event.target.value)} placeholder="Title" />
              <textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows={3} placeholder="Message" />
              <label className="checkbox-row"><input type="checkbox" checked={pinMessage} onChange={(event) => setPinMessage(event.target.checked)} />Pin this announcement</label>
              <button className="primary-button" onClick={() => {
                if (!messageTitle.trim() || !messageBody.trim()) return;
                void applyAction({ action: "addAnnouncement", title: messageTitle, body: messageBody, pinned: pinMessage });
                setMessageTitle("");
                setMessageBody("");
                setPinMessage(false);
              }}>Post announcement</button>
            </div>
            <div className="message-list">
              {state.announcements.map((item) => (
                <article className="message" key={item.id}>
                  <div className="message-meta"><strong>{item.title}</strong>{item.pinned && <span className="pin-tag">Pinned</span>}</div>
                  <p>{item.body}</p>
                  <small>{item.date}</small>
                  <button className="tiny-button" onClick={() => applyAction({ action: "togglePinnedAnnouncement", announcementId: item.id })}>{item.pinned ? "Unpin" : "Pin"}</button>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header"><h2>Score rules</h2></div>
            <div className="rule-groups">
              {Object.entries(scoreRules).map(([key, rules]) => (
                <div key={key} className="rule-group">
                  <h3>{key}</h3>
                  <ul>{rules.map((rule) => (<li key={rule}>{rule}</li>))}</ul>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="panel-header"><h2>Toolkit</h2></div>
            <div className="toolkit-grid">
              <section className="mini-panel">
                <h3>Timer</h3>
                <div className="timer-display">{formatTime(timeLeft)}</div>
                <div className="timer-controls">
                  <input type="number" min={1} max={60} value={timerMinutes} onChange={(event) => {
                    const value = Number(event.target.value) || 1;
                    setTimerMinutes(value);
                    setTimeLeft(value * 60);
                  }} />
                  <button className="primary-button" onClick={() => setTimerRunning((current) => !current)}>{timerRunning ? "Pause" : "Start"}</button>
                  <button className="secondary-button" onClick={() => {
                    setTimerRunning(false);
                    setTimeLeft(timerMinutes * 60);
                  }}>Reset</button>
                </div>
              </section>

              <section className="mini-panel">
                <h3>Lucky draw</h3>
                <div className="draw-controls">
                  <input value={drawTitle} onChange={(event) => setDrawTitle(event.target.value)} placeholder="Draw session title" />
                  <select value={drawMode} onChange={(event) => setDrawMode(event.target.value as DrawMode)}>
                    <option value="repeat">Mode A: repeat draw</option>
                    <option value="nonrepeat">Mode B: non-repeat draw</option>
                  </select>
                  <button className="primary-button" onClick={() => applyAction({ action: "createDrawSession", title: drawTitle, mode: drawMode })}>Create draw</button>
                  <button className="secondary-button" onClick={() => activeDraw && applyAction({ action: "runDraw", sessionId: activeDraw.id })}>Draw name</button>
                  <button className="secondary-button" onClick={() => activeDraw && applyAction({ action: "undoDraw", sessionId: activeDraw.id })}>Undo last draw</button>
                </div>

                <div className="draw-session-selector">
                  {state.drawSessions.map((session) => (
                    <button key={session.id} className={session.id === state.activeDrawId ? "selected-draw" : "draw-option"} onClick={() => applyAction({ action: "setActiveDraw", sessionId: session.id })}>
                      {session.title} ({session.mode})
                    </button>
                  ))}
                </div>

                <p className="draw-result"><strong>Latest draw:</strong> {latestDrawName}</p>

                <div className="draw-columns">
                  <div>
                    <h4>Remaining names</h4>
                    <ul>
                      {(activeDraw?.queue ?? []).map((studentId) => {
                        const student = state.students.find((item) => item.id === studentId);
                        return <li key={studentId}>{student?.engName ?? "Unknown"}</li>;
                      })}
                    </ul>
                  </div>
                  <div>
                    <h4>Draw sequence</h4>
                    <ul>
                      {(activeDraw?.history ?? []).slice().reverse().map((entry) => (
                        <li key={entry.id}>{entry.studentName}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
