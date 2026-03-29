# ⚖ Law Chambers of Jai Anant Dehadrai
## Case & Compliance Management System

---

## 📁 Project Structure

```
jad-chambers/
├── index.html                        ← Main case manager app (open in browser)
├── data/
│   └── cases.json                    ← All case data (edit this to update cases)
├── scripts/
│   ├── package.json                  ← Node.js dependencies
│   ├── send-alerts.js                ← Email alert script (run by GitHub Actions)
│   └── update_cases.js              ← CLI tool to add/edit/remove cases
├── .github/
│   └── workflows/
│       └── daily-alert.yml          ← GitHub Actions: runs alert email every morning
└── docs/
    ├── SETUP.md                      ← Step-by-step setup guide
    └── REALTIME_SHARING.md          ← How to share in real-time across team
```

---

## 🚀 Quick Start — Local Use

1. **Open `index.html`** directly in any browser — no server needed.
2. All case data is saved in your browser's localStorage automatically.
3. To persist data across devices, follow the **Real-Time Sharing** guide below.

---

## 📧 Email Automation via GitHub Actions

### One-Time Setup (15 minutes)

**Step 1 — Create a GitHub repository**
```bash
git init
git add .
git commit -m "Initial commit — JAD Chambers Case Manager"
git remote add origin https://github.com/YOUR_USERNAME/jad-chambers.git
git push -u origin main
```

**Step 2 — Add GitHub Secrets**

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|-------------|-------|
| `SMTP_HOST` | `smtp.gmail.com` (for Gmail) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your.email@gmail.com` |
| `SMTP_PASS` | Your Gmail App Password (see Step 3) |
| `ALERT_TO`  | `jai@example.com` |
| `ALERT_CC`  | `clerk@example.com` (optional) |
| `ALERT_DAYS`| `4` (alert days before deadline) |

**Step 3 — Generate Gmail App Password**
1. Go to Google Account → Security → 2-Step Verification (enable if not already)
2. Search for "App passwords" in Google Account
3. Create app password → Select "Mail" → Copy the 16-character password
4. Use this as `SMTP_PASS` (NOT your Gmail login password)

**Step 4 — Enable GitHub Actions**
- The workflow at `.github/workflows/daily-alert.yml` runs automatically at **8:00 AM IST** daily
- You can also trigger it manually: GitHub repo → **Actions** tab → **Daily Compliance Alert** → **Run workflow**

**Step 5 — Install dependencies (for local testing only)**
```bash
cd scripts
npm install
node send-alerts.js   # test run
```

---

## 🔄 Updating Case Data

### Option A — Through the Browser (Recommended)
Open `index.html` → Use the **+ Add Matter** button → Changes save to localStorage

### Option B — Edit `data/cases.json` directly
Open `data/cases.json` in any text editor and update the relevant section (`sc`, `hc`, `lc`, `tr`).
Commit and push to GitHub. The next morning's alert run will use the new data.

### Option C — Command Line
```bash
cd scripts
npm install

# List all cases
node update_cases.js list

# List only Supreme Court cases
node update_cases.js list sc

# Add a case
node update_cases.js add hc "Ram vs State" "WP/100/2026" "2026-04-01" "2026-05-01" "File written statement"

# Mark case as complied (index 0 = first case)
node update_cases.js status hc 0 complied

# Remove a case
node update_cases.js remove lc 2

# Export a backup
node update_cases.js export
```

---

## 🌐 Real-Time Sharing

See `docs/REALTIME_SHARING.md` for detailed instructions. Summary:

| Method | Best For | Cost |
|--------|----------|------|
| **GitHub Pages** | Read-only sharing, static hosting | Free |
| **Firebase Realtime DB** | Live sync across team | Free tier available |
| **Supabase** | Full database + auth | Free tier available |
| **Netlify + Netlify Functions** | Simple hosting with form support | Free tier available |

---

## 🔒 Privacy Note

`cases.json` contains sensitive client information. If this repository is public on GitHub,
**move `data/cases.json` to `.gitignore`** and use a private repo or a secure database instead.

Add to `.gitignore`:
```
data/cases.json
scripts/alert.log
scripts/node_modules/
```

---

*Law Chambers of Jai Anant Dehadrai — Internal Use Only*
