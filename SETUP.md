# ⚙ Setup Guide — JAD Chambers Case Manager

## Prerequisites
- A computer with a modern browser (Chrome, Firefox, Edge)
- A GitHub account (free) — for automation and online hosting
- Node.js 18+ (free) — only needed for email automation

---

## Part 1 — Use Locally (No Setup Required)

1. Unzip the project folder
2. Double-click `index.html` to open in your browser
3. All data saves automatically in the browser
4. ✅ Done — the app works immediately

---

## Part 2 — Set Up Automated Emails (30 minutes)

### A. Install Node.js
Download from https://nodejs.org → Install the LTS version

### B. Test email script locally
```bash
# Open terminal / command prompt in the project folder
cd scripts
npm install

# Set environment variables and test
# On Windows:
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USER=yourmail@gmail.com
set SMTP_PASS=your-app-password
set ALERT_TO=jai@example.com
set ALERT_DAYS=999
node send-alerts.js

# On Mac/Linux:
SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=yourmail@gmail.com \
SMTP_PASS=your-app-password ALERT_TO=jai@example.com ALERT_DAYS=999 \
node send-alerts.js
```

### C. Push to GitHub and add secrets
See README.md → "Email Automation via GitHub Actions"

---

## Part 3 — Get a Gmail App Password

1. Sign into your Google Account
2. Go to: https://myaccount.google.com/security
3. Scroll to "How you sign in to Google"
4. Click "2-Step Verification" → enable it if not already on
5. Go back to Security → search "App passwords"
6. Create an app password → name it "JAD Chambers"
7. Copy the 16-character password — this is your `SMTP_PASS`

⚠️ Never use your actual Gmail password. Always use an App Password.

---

## Part 4 — Keep Case Data Updated

The GitHub Actions workflow reads `data/cases.json` each morning.
To keep alerts accurate, update this file when cases change.

**Easiest method — edit on GitHub:**
1. Go to your GitHub repo
2. Click `data/cases.json`
3. Click the pencil (edit) icon
4. Make changes in the JSON editor
5. Click "Commit changes"
6. ✅ Next morning's alert will use the new data

**Command line method:**
```bash
cd scripts
node update_cases.js list          # see all cases
node update_cases.js status sc 0 complied   # mark SC case 0 as complied
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Email not sending | Check SMTP_USER and SMTP_PASS are set correctly as Secrets |
| Gmail authentication error | Make sure you're using an **App Password**, not your Gmail password |
| Workflow not running | Check GitHub Actions tab — ensure Actions are enabled for the repo |
| Cases.json not updating | Make sure you committed and pushed the changes |
| Alert not showing in browser | Clear browser localStorage: Dev Tools → Application → Storage → Clear |

---

*Law Chambers of Jai Anant Dehadrai — Internal Use Only*
