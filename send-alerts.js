/**
 * JAD Chambers — Daily Compliance Alert Script
 * ─────────────────────────────────────────────
 * Run by GitHub Actions every morning.
 * Reads cases.json, finds upcoming deadlines, sends email alerts.
 *
 * Setup:
 *   cd scripts && npm install
 *   Set GitHub Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_TO, ALERT_CC
 */

const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

// ── Config from environment ──────────────────────────────────────────────────
const SMTP_HOST  = process.env.SMTP_HOST  || 'smtp.gmail.com';
const SMTP_PORT  = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER  = process.env.SMTP_USER;
const SMTP_PASS  = process.env.SMTP_PASS;
const ALERT_TO   = process.env.ALERT_TO;
const ALERT_CC   = process.env.ALERT_CC   || '';
const ALERT_DAYS = parseInt(process.env.ALERT_DAYS || '4');

// ── Load case data ───────────────────────────────────────────────────────────
const dataPath = path.join(__dirname, '..', 'data', 'cases.json');
const data     = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const COURT_LABELS = {
  sc: 'Supreme Court of India',
  hc: 'High Court',
  lc: 'Lower Court',
  tr: 'Tribunals'
};

// ── Date helpers ─────────────────────────────────────────────────────────────
function daysFrom(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
}

// ── Find alerts ──────────────────────────────────────────────────────────────
const alerts = [];

Object.entries(data).forEach(([key, cases]) => {
  cases.forEach(row => {
    const nd = daysFrom(row.ndoh);
    const dd = daysFrom(row.duedate);

    if (nd !== null && nd >= 0 && nd <= ALERT_DAYS) {
      alerts.push({ ...row, courtKey: key, type: 'NDOH', diff: nd, dateLabel: formatDate(row.ndoh) });
    } else if (nd !== null && nd < 0) {
      alerts.push({ ...row, courtKey: key, type: 'NDOH (OVERDUE)', diff: nd, dateLabel: formatDate(row.ndoh) });
    }

    if (dd !== null && dd >= 0 && dd <= ALERT_DAYS) {
      alerts.push({ ...row, courtKey: key, type: 'Compliance Due', diff: dd, dateLabel: formatDate(row.duedate) });
    } else if (dd !== null && dd < 0) {
      alerts.push({ ...row, courtKey: key, type: 'Compliance OVERDUE', diff: dd, dateLabel: formatDate(row.duedate) });
    }
  });
});

// Sort: overdue first, then by urgency
alerts.sort((a, b) => a.diff - b.diff);

// ── Logging ──────────────────────────────────────────────────────────────────
const logLines = [];
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logLines.push(line);
}

log(`JAD Chambers — Compliance Alert Run`);
log(`Checking ${ALERT_DAYS} days ahead. Found ${alerts.length} alert(s).`);

if (!alerts.length) {
  log('No alerts today. All compliance deadlines are clear.');
  fs.writeFileSync(path.join(__dirname, 'alert.log'), logLines.join('\n'));
  process.exit(0);
}

// ── Build HTML email ─────────────────────────────────────────────────────────
function urgencyBadge(diff) {
  if (diff < 0) return `<span style="background:#7b1a1a;color:#f9a8a8;padding:2px 10px;border-radius:3px;font-size:11px;font-weight:600;">OVERDUE ${Math.abs(diff)}d</span>`;
  if (diff === 0) return `<span style="background:#7a4800;color:#ffc87a;padding:2px 10px;border-radius:3px;font-size:11px;font-weight:600;">DUE TODAY</span>`;
  if (diff <= 2) return `<span style="background:#5a1a1a;color:#f9a8a8;padding:2px 10px;border-radius:3px;font-size:11px;font-weight:600;">${diff}d REMAINING</span>`;
  return `<span style="background:#1a3a5a;color:#90c4f0;padding:2px 10px;border-radius:3px;font-size:11px;font-weight:600;">${diff}d remaining</span>`;
}

function buildHTML() {
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  const rows = alerts.map(a => `
    <tr style="border-bottom:1px solid #2a2e3a;">
      <td style="padding:12px 14px;font-family:'Georgia',serif;font-size:13px;color:#ddd;max-width:200px;">
        <strong style="color:#e8d5a0;">${a.title || '—'}</strong><br>
        <span style="font-size:11px;color:#888;font-family:monospace;">${a.casenum || ''}</span>
      </td>
      <td style="padding:12px 14px;font-size:12px;color:#aaa;">${COURT_LABELS[a.courtKey]}</td>
      <td style="padding:12px 14px;font-size:12px;color:#aaa;font-family:monospace;">${a.type}</td>
      <td style="padding:12px 14px;font-size:12px;font-family:monospace;color:#ccc;">${a.dateLabel}</td>
      <td style="padding:12px 14px;">${urgencyBadge(a.diff)}</td>
      <td style="padding:12px 14px;font-size:12px;color:#bbb;font-style:italic;max-width:180px;">${a.compliance || '—'}</td>
      <td style="padding:12px 14px;">
        <span style="font-size:11px;padding:2px 8px;border-radius:2px;border:1px solid #444;color:#aaa;text-transform:uppercase;font-family:monospace;">${a.status || 'pending'}</span>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0b0d12;margin:0;padding:0;font-family:'Georgia',serif;">
  <div style="max-width:900px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#111520,#0e1118);border:1px solid #2a2e3a;border-top:2px solid #c9a84c;border-radius:6px;padding:28px 32px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
        <div style="font-size:28px;">⚖</div>
        <div>
          <div style="font-family:'Georgia',serif;font-size:18px;font-weight:700;color:#e8c97a;letter-spacing:1px;">Law Chambers of Jai Anant Dehadrai</div>
          <div style="font-size:12px;color:#888;margin-top:2px;font-style:italic;">Daily Compliance Alert — ${today}</div>
        </div>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,#2a2e3a,transparent);margin:16px 0;"></div>
      <div style="font-size:13px;color:#aaa;font-style:italic;">
        This automated report identifies <strong style="color:#e8c97a;">${alerts.length} compliance matter${alerts.length !== 1 ? 's' : ''}</strong> requiring attention within the next <strong style="color:#e8c97a;">${ALERT_DAYS} days</strong>.
      </div>
    </div>

    <!-- Table -->
    <div style="background:#111520;border:1px solid #2a2e3a;border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#0e1118;padding:14px 18px;border-bottom:1px solid #2a2e3a;">
        <span style="font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;">Compliance Register — Matters Requiring Action</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#0d1016;border-bottom:1px solid #2a2e3a;">
              <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a84c;white-space:nowrap;">Case</th>
              <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a84c;white-space:nowrap;">Court</th>
              <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a84c;white-space:nowrap;">Type</th>
              <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a84c;white-space:nowrap;">Date</th>
              <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a84c;white-space:nowrap;">Urgency</th>
              <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a84c;white-space:nowrap;">Compliance</th>
              <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a84c;white-space:nowrap;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#555;font-size:11px;font-style:italic;line-height:1.8;">
      This is an automated message from the JAD Chambers Case Management System.<br>
      Generated by GitHub Actions · Do not reply to this email.
    </div>

  </div>
</body>
</html>`;
}

// ── Build plain text fallback ────────────────────────────────────────────────
function buildText() {
  const lines = [
    `LAW CHAMBERS OF JAI ANANT DEHADRAI`,
    `Daily Compliance Alert`,
    `Date: ${new Date().toLocaleDateString('en-IN')}`,
    ``,
    `${alerts.length} matter(s) require attention within ${ALERT_DAYS} days:`,
    ``,
    `─`.repeat(70),
  ];

  alerts.forEach((a, i) => {
    const diff = a.diff < 0 ? `OVERDUE by ${Math.abs(a.diff)} day(s)` : a.diff === 0 ? 'DUE TODAY' : `${a.diff} day(s) remaining`;
    lines.push(`${i+1}. ${a.title || '—'}`);
    lines.push(`   Case No : ${a.casenum || '—'}`);
    lines.push(`   Court   : ${COURT_LABELS[a.courtKey]}`);
    lines.push(`   Type    : ${a.type}`);
    lines.push(`   Date    : ${a.dateLabel}`);
    lines.push(`   Urgency : ${diff}`);
    if (a.compliance) lines.push(`   Action  : ${a.compliance}`);
    lines.push(`   Status  : ${a.status || 'pending'}`);
    lines.push(`─`.repeat(70));
  });

  lines.push('');
  lines.push('This is an automated message from JAD Chambers Case Management System.');
  return lines.join('\n');
}

// ── Send email ───────────────────────────────────────────────────────────────
async function sendEmail() {
  if (!SMTP_USER || !SMTP_PASS || !ALERT_TO) {
    log('ERROR: Missing SMTP_USER, SMTP_PASS, or ALERT_TO environment variables.');
    log('Set them as GitHub Secrets in Settings → Secrets and variables → Actions.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const overdueCount = alerts.filter(a => a.diff < 0).length;
  const todayCount   = alerts.filter(a => a.diff === 0).length;

  let subjectPrefix = '⚖';
  if (overdueCount > 0) subjectPrefix = '🔴';
  else if (todayCount > 0) subjectPrefix = '🟠';

  const subject = `${subjectPrefix} JAD Chambers — ${alerts.length} Compliance Alert${alerts.length !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`;

  const mailOptions = {
    from: `"JAD Chambers Alerts" <${SMTP_USER}>`,
    to:   ALERT_TO,
    cc:   ALERT_CC || undefined,
    subject,
    text:    buildText(),
    html:    buildHTML(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    log(`Email sent successfully. Message ID: ${info.messageId}`);
    log(`Recipient: ${ALERT_TO}${ALERT_CC ? ' | CC: ' + ALERT_CC : ''}`);
  } catch (err) {
    log(`ERROR sending email: ${err.message}`);
    process.exit(1);
  }
}

sendEmail().finally(() => {
  fs.writeFileSync(path.join(__dirname, 'alert.log'), logLines.join('\n'));
});
