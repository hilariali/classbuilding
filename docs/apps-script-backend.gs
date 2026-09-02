const SHEETS = {
  settings: 'Settings',
  students: 'Students',
  announcements: 'Announcements',
  drawSessions: 'DrawSessions',
};

const HEADERS = {
  settings: ['schoolName', 'className', 'teacherPasscode'],
  students: ['id', 'no', 'chiName', 'otherName', 'engName', 'regNo', 'house', 'gender', 'role', 'academic', 'motivation', 'service', 'roleModel', 'overall', 'remark'],
  announcements: ['id', 'title', 'body', 'pinned', 'date'],
  drawSessions: ['id', 'title', 'mode', 'queueJson', 'historyJson', 'isActive'],
};

const TEMPLATE_ROWS = {
  settings: [
    {
      schoolName: 'Your School Name',
      className: 'P6A',
      teacherPasscode: '1234',
    },
  ],
  students: [
    {
      id: 1,
      no: '1',
      chiName: '陳小明',
      otherName: '小明',
      engName: 'Ming Chan',
      regNo: 'S-101',
      house: 'Red',
      gender: 'Boy',
      role: 'Class Monitor',
      academic: 0,
      motivation: 0,
      service: 0,
      roleModel: 0,
      overall: 0,
      remark: 'Example row: replace with your student data',
    },
    {
      id: 2,
      no: '2',
      chiName: '',
      otherName: '',
      engName: '',
      regNo: '',
      house: '',
      gender: '',
      role: '',
      academic: 0,
      motivation: 0,
      service: 0,
      roleModel: 0,
      overall: 0,
      remark: 'Add next student here',
    },
  ],
  announcements: [
    {
      id: Date.now(),
      title: 'Welcome message',
      body: 'Edit this row to post your first class announcement.',
      pinned: true,
      date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    },
  ],
  drawSessions: [
    {
      id: 1,
      title: 'Main draw',
      mode: 'repeat',
      queueJson: '[]',
      historyJson: '[]',
      isActive: true,
    },
  ],
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'initTemplate') {
      const summary = setupTemplate();
      return json_({ ok: true, summary: summary });
    }

    if (action !== 'getState') {
      return json_({ error: 'Unsupported GET action' });
    }

    ensureSheets_();
    return json_({ state: readStateFromSheets_() });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    ensureSheets_();
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const current = readStateFromSheets_();
    const result = applyActionToState_(current, payload);
    writeStateToSheets_(result.state);

    return json_(result);
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function ensureSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEETS).forEach((key) => {
    const sheetName = SHEETS[key];
    const headers = HEADERS[key];
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const isHeaderEmpty = firstRow.every((cell) => String(cell).trim() === '');
    if (isHeaderEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const hasMismatchedHeaders = headers.some((header, index) => String(firstRow[index] || '') !== header);
    if (hasMismatchedHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const hasDataRows = sheet.getLastRow() > 1;
    if (!hasDataRows) {
      const seedRows = TEMPLATE_ROWS[key] || [];
      if (seedRows.length > 0) {
        const values = seedRows.map((row) => headers.map((header) => row[header]));
        sheet.getRange(2, 1, values.length, headers.length).setValues(values);
      }
    }
  });
}

function setupTemplate() {
  ensureSheets_();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  return {
    settingsRows: Math.max(spreadsheet.getSheetByName(SHEETS.settings).getLastRow() - 1, 0),
    studentsRows: Math.max(spreadsheet.getSheetByName(SHEETS.students).getLastRow() - 1, 0),
    announcementsRows: Math.max(spreadsheet.getSheetByName(SHEETS.announcements).getLastRow() - 1, 0),
    drawSessionsRows: Math.max(spreadsheet.getSheetByName(SHEETS.drawSessions).getLastRow() - 1, 0),
  };
}

function readStateFromSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = spreadsheet.getSheetByName(SHEETS.settings);
  const studentsSheet = spreadsheet.getSheetByName(SHEETS.students);
  const announcementsSheet = spreadsheet.getSheetByName(SHEETS.announcements);
  const drawSheet = spreadsheet.getSheetByName(SHEETS.drawSessions);

  const settingsRows = readRows_(settingsSheet);
  const branding = settingsRows[0] || {
    schoolName: 'CWCC',
    className: 'P6A',
    teacherPasscode: '1234',
  };

  const students = readRows_(studentsSheet).map((row) => ({
    id: toNumber_(row.id),
    no: String(row.no || ''),
    chiName: String(row.chiName || ''),
    otherName: String(row.otherName || ''),
    engName: String(row.engName || ''),
    regNo: String(row.regNo || ''),
    house: String(row.house || ''),
    gender: String(row.gender || ''),
    role: String(row.role || ''),
    academic: toNumber_(row.academic),
    motivation: toNumber_(row.motivation),
    service: toNumber_(row.service),
    roleModel: toNumber_(row.roleModel),
    overall: toNumber_(row.overall),
    remark: String(row.remark || ''),
  }));

  const announcements = readRows_(announcementsSheet).map((row) => ({
    id: toNumber_(row.id),
    title: String(row.title || ''),
    body: String(row.body || ''),
    pinned: String(row.pinned).toLowerCase() === 'true',
    date: String(row.date || ''),
  }));

  const drawSessions = readRows_(drawSheet).map((row) => ({
    id: toNumber_(row.id),
    title: String(row.title || ''),
    mode: String(row.mode || 'repeat'),
    queue: parseJson_(row.queueJson, []),
    history: parseJson_(row.historyJson, []),
    isActive: String(row.isActive).toLowerCase() === 'true',
  }));

  let activeDrawId = 0;
  drawSessions.forEach((session) => {
    if (session.isActive) activeDrawId = session.id;
  });

  const cleanedDrawSessions = drawSessions.map((session) => ({
    id: session.id,
    title: session.title,
    mode: session.mode,
    queue: session.queue,
    history: session.history,
  }));

  return {
    schoolName: String(branding.schoolName || 'CWCC'),
    className: String(branding.className || 'P6A'),
    teacherPasscode: String(branding.teacherPasscode || '1234'),
    students: students,
    announcements: announcements,
    drawSessions: cleanedDrawSessions,
    activeDrawId: activeDrawId || (cleanedDrawSessions[0] ? cleanedDrawSessions[0].id : 0),
    updatedAt: new Date().toISOString(),
  };
}

function writeStateToSheets_(state) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  writeRows_(spreadsheet.getSheetByName(SHEETS.settings), HEADERS.settings, [{
    schoolName: state.schoolName || 'CWCC',
    className: state.className || 'P6A',
    teacherPasscode: state.teacherPasscode || '1234',
  }]);

  writeRows_(spreadsheet.getSheetByName(SHEETS.students), HEADERS.students, state.students.map((student) => ({
    id: student.id,
    no: student.no,
    chiName: student.chiName,
    otherName: student.otherName,
    engName: student.engName,
    regNo: student.regNo,
    house: student.house,
    gender: student.gender,
    role: student.role,
    academic: student.academic,
    motivation: student.motivation,
    service: student.service,
    roleModel: student.roleModel,
    overall: student.overall,
    remark: student.remark,
  })));

  writeRows_(spreadsheet.getSheetByName(SHEETS.announcements), HEADERS.announcements, state.announcements.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    pinned: item.pinned,
    date: item.date,
  })));

  writeRows_(spreadsheet.getSheetByName(SHEETS.drawSessions), HEADERS.drawSessions, state.drawSessions.map((session) => ({
    id: session.id,
    title: session.title,
    mode: session.mode,
    queueJson: JSON.stringify(session.queue || []),
    historyJson: JSON.stringify(session.history || []),
    isActive: session.id === state.activeDrawId,
  })));
}

function applyActionToState_(state, payload) {
  const action = String(payload.action || '');

  if (action === 'updateBranding') {
    const schoolName = String(payload.schoolName || '').trim();
    const className = String(payload.className || '').trim();
    if (schoolName) state.schoolName = schoolName;
    if (className) state.className = className;
    return { state: state };
  }

  if (action === 'updateTeacherPasscode') {
    const teacherPasscode = String(payload.teacherPasscode || '').trim();
    if (teacherPasscode) state.teacherPasscode = teacherPasscode;
    return { state: state };
  }

  if (action === 'updateScore') {
    const student = state.students.find((item) => item.id === toNumber_(payload.studentId));
    if (student) {
      const field = String(payload.field || 'academic');
      const delta = toNumber_(payload.delta);
      student[field] = Math.max(0, toNumber_(student[field]) + delta);
      student.overall = toNumber_(student.academic) + toNumber_(student.motivation) + toNumber_(student.service) + toNumber_(student.roleModel);
    }
    return { state: state };
  }

  if (action === 'updateRemark') {
    const student = state.students.find((item) => item.id === toNumber_(payload.studentId));
    if (student) student.remark = String(payload.remark || '');
    return { state: state };
  }

  if (action === 'updateRole') {
    const student = state.students.find((item) => item.id === toNumber_(payload.studentId));
    if (student) student.role = String(payload.role || '');
    return { state: state };
  }

  if (action === 'addAnnouncement') {
    const pin = Boolean(payload.pinned);
    if (pin) {
      state.announcements = state.announcements.map((item) => {
        item.pinned = false;
        return item;
      });
    }

    state.announcements.unshift({
      id: Date.now(),
      title: String(payload.title || '').trim(),
      body: String(payload.body || '').trim(),
      pinned: pin,
      date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    });
    return { state: state };
  }

  if (action === 'togglePinnedAnnouncement') {
    const targetId = toNumber_(payload.announcementId);
    state.announcements = state.announcements.map((item) => {
      if (item.id === targetId) {
        item.pinned = !item.pinned;
      } else {
        item.pinned = false;
      }
      return item;
    });
    return { state: state };
  }

  if (action === 'createDrawSession') {
    const mode = String(payload.mode || 'repeat');
    const title = String(payload.title || '').trim() || 'Draw Session';

    const session = {
      id: Date.now(),
      title: title,
      mode: mode,
      queue: state.students.map((student) => student.id),
      history: [],
    };

    state.drawSessions.push(session);
    state.activeDrawId = session.id;
    return { state: state };
  }

  if (action === 'setActiveDraw') {
    state.activeDrawId = toNumber_(payload.sessionId);
    return { state: state };
  }

  if (action === 'runDraw') {
    const session = state.drawSessions.find((entry) => entry.id === toNumber_(payload.sessionId));
    if (!session || !session.queue || session.queue.length === 0) {
      return { state: state };
    }

    const index = Math.floor(Math.random() * session.queue.length);
    const studentId = session.queue[index];
    const student = state.students.find((item) => item.id === studentId);

    if (!student) {
      return { state: state };
    }

    if (session.mode === 'nonrepeat') {
      session.queue = session.queue.filter((id) => id !== studentId);
    }

    if (!session.history) session.history = [];
    session.history.push({
      id: Date.now(),
      studentId: student.id,
      studentName: student.engName,
      mode: session.mode,
      drawAt: new Date().toISOString(),
    });

    return { state: state, meta: { drawnStudentName: student.engName } };
  }

  if (action === 'undoDraw') {
    const session = state.drawSessions.find((entry) => entry.id === toNumber_(payload.sessionId));
    if (!session || !session.history || session.history.length === 0) {
      return { state: state };
    }

    const last = session.history.pop();
    if (session.mode === 'nonrepeat' && last && session.queue.indexOf(last.studentId) === -1) {
      session.queue.push(last.studentId);
    }

    return { state: state };
  }

  return { state: state };
}

function readRows_(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function writeRows_(sheet, headers, rows) {
  const rowCount = Math.max(sheet.getLastRow(), 1);
  if (rowCount > 1) {
    sheet.getRange(2, 1, rowCount - 1, headers.length).clearContent();
  }

  if (!rows.length) return;

  const values = rows.map((row) => headers.map((header) => row[header]));
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function toNumber_(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseJson_(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
