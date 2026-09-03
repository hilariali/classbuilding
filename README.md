# Class Building Dashboard

A lightweight classroom management dashboard for teachers, designed around the following workflow:

- student list management
- score tracking across academic, motivation, service, and role model categories
- announcement banners
- teacher remarks and comments
- lucky draw sessions with repeat and non-repeat modes
- timer and class toolkit utilities

This project is built with Next.js and is easy to deploy on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Use the default Next.js settings.
4. Deploy.
5. If you want a custom domain, add it in the Vercel dashboard.

This is the easiest hosting option for a teacher-facing classroom tool because it requires minimal setup and works well for a small dashboard.

## Google Sheets backend setup

This app can run in two backend modes:

- Apps Script mode (recommended): persistent backend in Google Sheets
- local fallback mode: in-memory backend for quick testing

To use Apps Script mode, add this in .env.local:

```bash
CLASSBUILDING_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-deployment-id/exec
```

Local setup steps:

1. Copy .env.example to .env.local
2. Put your Apps Script Web App URL in CLASSBUILDING_APPS_SCRIPT_URL
3. Restart `npm run dev`

Apps Script one-time setup steps:

1. Open your target Google Sheet and copy the Sheet ID from the URL.
2. In Apps Script editor, paste the full code from docs/apps-script-backend.gs.
3. Run `setSpreadsheetId("YOUR_SHEET_ID")` once.
4. Run `setupTemplate()` once.
5. Confirm these tabs are created with sample rows: Settings, Students, Announcements, DrawSessions.

Vercel setup steps:

1. Go to Vercel project -> Settings -> Environment Variables
2. Add `CLASSBUILDING_APPS_SCRIPT_URL`
3. Paste your Apps Script Web App URL as the value
4. Select target environments (Production; optional Preview/Development)
5. Save and redeploy

### Required sheet tabs

Create these tabs in one spreadsheet:

1. Settings
2. Students
3. Announcements
4. DrawSessions

Good news: you do not need to create these manually if you do not want to. The Apps Script will auto-create all tabs with headers and sample rows on first run.

### Required headers

Settings headers:

```text
schoolName | className | teacherPasscode
```

Students headers:

```text
id | no | chiName | otherName | engName | regNo | house | gender | role | academic | motivation | service | roleModel | overall | remark
```

Announcements headers:

```text
id | title | body | pinned | date
```

DrawSessions headers:

```text
id | title | mode | queueJson | historyJson | isActive
```

### Template auto-generation behavior

When the Apps Script runs for the first time, it will:

1. Create missing tabs automatically (Settings, Students, Announcements, DrawSessions).
2. Add required header columns.
3. Insert sample template rows so teachers can immediately see what to fill in.

Teachers can replace sample rows with real class data directly in Google Sheets.

If your sheet was created before this update and appears empty, run one of these once:

1. In Apps Script editor, run function `setupTemplate`
2. Or open this URL in browser:
  `https://script.google.com/macros/s/your-deployment-id/exec?action=initTemplate`

### Apps Script action contract

GET action:

- query string action=getState
- returns { state }

POST body actions:

- updateScore
- updateRemark
- updateRole
- updateBranding
- updateTeacherPasscode
- addAnnouncement
- togglePinnedAnnouncement
- createDrawSession
- removeDrawSession
- setActiveDraw
- runDraw
- undoDraw

Each POST should return { state } and optionally { meta: { drawnStudentName } } for runDraw.

### Apps Script implementation file

Complete Apps Script backend logic is included in this project:

- docs/apps-script-backend.gs

Copy the full file into Google Apps Script and deploy it as a Web App.

### Minimal Apps Script starter

If you want to start from scratch instead, use this base skeleton:

```javascript
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action !== 'getState') {
    return json({ error: 'Unsupported GET action' });
  }

  const state = readStateFromSheets_();
  return json({ state: state });
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  const action = payload.action || '';

  const state = applyActionToSheets_(action, payload);
  return json({ state: state });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Then deploy it as a web app:

1. Extensions -> Apps Script -> Deploy -> New deployment.
2. Select Web app.
3. Execute as: Me.
4. Who has access: Anyone with the link.
5. Copy the deployment URL into CLASSBUILDING_APPS_SCRIPT_URL.

### Why this setup is a good fit

- zero backend server needed for a small school use case
- easy to edit by non-technical teachers
- can be hosted on Vercel with a simple frontend
- supports quick classroom adoption without a full database

## Future extension ideas

- connect to Firebase for auth and real-time sync
- replace localStorage with Google Sheets write-back functions
- add teacher login, role permissions, and data export
- support multiple classes and multiple terms
