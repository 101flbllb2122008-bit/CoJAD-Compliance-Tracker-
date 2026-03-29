# 🌐 Real-Time Sharing Guide
## Law Chambers of Jai Anant Dehadrai — Case Manager

This guide explains how to share the case manager so **all advocates, clerks,
and staff see changes in real time** without emailing files back and forth.

---

## Option 1 — GitHub Pages (Simplest — Free)

**What it does:** Hosts the app online so anyone with the link can view it.
Changes made in `cases.json` on GitHub reflect after a 1-2 minute redeploy.

### Setup (5 minutes)
1. Push the project to a **private** GitHub repository
2. Go to repo → **Settings** → **Pages**
3. Source: Deploy from branch → `main` → `/ (root)`
4. Your app will be live at `https://YOUR-USERNAME.github.io/jad-chambers/`

### Updating data
- Edit `data/cases.json` on GitHub (web editor or git push)
- Changes reflect within ~60 seconds after GitHub rebuilds Pages

### Limitation
- Anyone with the URL can view all case data — only share with trusted persons
- Not truly real-time (1-2 min delay for updates)

---

## Option 2 — Firebase Realtime Database (True Real-Time — Recommended)

**What it does:** Every change — adding a case, updating status — reflects
instantly on all open browsers, phones, and tablets. No refresh needed.

### Setup (20 minutes)

**Step 1 — Create Firebase project**
1. Go to https://console.firebase.google.com
2. Create project → "jad-chambers"
3. Add a **Web app** → copy the config object

**Step 2 — Enable Realtime Database**
1. Firebase Console → Build → Realtime Database → Create Database
2. Start in **test mode** (you'll add rules in Step 4)
3. Copy the database URL (looks like `https://jad-chambers-default-rtdb.firebaseio.com`)

**Step 3 — Modify `index.html` to use Firebase**

Add before `</head>`:
```html
<!-- Firebase SDK -->
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
  import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "jad-chambers.firebaseapp.com",
    databaseURL: "https://jad-chambers-default-rtdb.firebaseio.com",
    projectId: "jad-chambers",
    storageBucket: "jad-chambers.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  const db  = getDatabase(app);
  const casesRef = ref(db, 'cases');

  // Listen for real-time changes from any user
  onValue(casesRef, (snapshot) => {
    const remoteData = snapshot.val();
    if (remoteData) {
      data = remoteData;
      renderAll();
    }
  });

  // Override saveData() to write to Firebase instead of localStorage
  window.saveDataRemote = function() {
    set(casesRef, data);
    localStorage.setItem('jadChambers_data', JSON.stringify(data)); // local backup
  };
</script>
```

Replace every call to `saveData()` in the script with `saveDataRemote()`.

**Step 4 — Set Firebase Security Rules**

In Firebase Console → Realtime Database → Rules:
```json
{
  "rules": {
    "cases": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

This requires login. For a simpler (less secure) setup, use `true` for both
while testing, then add auth later.

**Step 5 — Deploy**
Host `index.html` on GitHub Pages, Netlify, or any static host.
All users opening the same URL will share the same live data.

### Cost
- Firebase free tier: 1 GB storage, 10 GB/month transfer — more than enough for chambers use.

---

## Option 3 — Supabase (PostgreSQL + Real-Time)

**What it does:** Full relational database with real-time subscriptions.
Better for larger teams or if you want row-level access control (e.g., different
clerks see different courts).

### Setup overview
1. Create project at https://supabase.com
2. Create a `cases` table with columns matching the JSON fields
3. Enable **Realtime** on the table
4. Use the Supabase JS SDK in `index.html` instead of localStorage
5. Use **Row Level Security** to restrict who can edit which court's data

---

## Option 4 — WhatsApp/Telegram Bot (Alert-Only)

For a simpler approach where the main app stays local but alerts go to a group:

1. Create a **WhatsApp Business** or **Telegram Bot**
2. Modify `send-alerts.js` to use Telegram Bot API or Twilio WhatsApp API
3. Add the bot to a chambers group chat
4. Every morning, the bot posts overdue/upcoming compliance alerts to the group

### Telegram Bot (easiest)
```js
// In send-alerts.js, add:
const TELEGRAM_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT   = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' })
  });
}
```

---

## Comparison Summary

| Method | Real-Time | Setup | Cost | Best For |
|--------|-----------|-------|------|----------|
| GitHub Pages | ❌ (1-2 min delay) | ⭐ Easy | Free | Read-only sharing |
| Firebase | ✅ Instant | ⭐⭐ Medium | Free tier | Full team sync |
| Supabase | ✅ Instant | ⭐⭐⭐ Complex | Free tier | Larger teams, access control |
| WhatsApp/Telegram | ✅ Push alerts | ⭐⭐ Medium | Free/paid | Alert-only, no editing |

---

## Recommended Setup for JAD Chambers

1. **Firebase Realtime DB** for live data sync across devices
2. **GitHub Actions** for daily email digest to advocate and clerk
3. **Telegram Bot** for urgent same-day alerts to the chambers group

This combination gives you: shared live data + scheduled email reports + instant push alerts.

---

*Law Chambers of Jai Anant Dehadrai — Internal Use Only*
