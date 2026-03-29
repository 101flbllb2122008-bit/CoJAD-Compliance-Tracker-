/**
 * JAD Chambers — Case Data Update Script
 * ────────────────────────────────────────
 * Use this script to add, update, or remove cases from the command line
 * without opening the browser UI.
 *
 * Usage:
 *   node update_cases.js list [court]
 *   node update_cases.js add sc "Case Title" "Case No" "YYYY-MM-DD" "YYYY-MM-DD" "Compliance text"
 *   node update_cases.js status sc 0 complied
 *   node update_cases.js remove hc 2
 *   node update_cases.js export
 *
 * Courts: sc | hc | lc | tr
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'cases.json');

const COURTS = {
  sc: 'Supreme Court',
  hc: 'High Court',
  lc: 'Lower Court',
  tr: 'Tribunals'
};

function load() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('✓ cases.json updated.');
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

const [,, cmd, court, ...args] = process.argv;

const data = load();

switch (cmd) {
  case 'list': {
    const keys = court && COURTS[court] ? [court] : ['sc','hc','lc','tr'];
    keys.forEach(k => {
      console.log(`\n── ${COURTS[k]} (${data[k].length} matters) ──`);
      data[k].forEach((c, i) => {
        console.log(`  [${i}] ${c.title || '—'} | ${c.casenum || '—'} | NDOH: ${formatDate(c.ndoh)} | Due: ${formatDate(c.duedate)} | ${c.status}`);
      });
    });
    break;
  }

  case 'add': {
    if (!COURTS[court]) { console.error('Invalid court. Use: sc | hc | lc | tr'); process.exit(1); }
    const [title, casenum, ldoh, ndoh, compliance, duedate] = args;
    const newCase = {
      title:      title      || '',
      casenum:    casenum    || '',
      court:      '',
      ldoh:       ldoh       || '',
      ndoh:       ndoh       || '',
      compliance: compliance || '',
      duedate:    duedate    || '',
      status:     'pending'
    };
    data[court].push(newCase);
    save(data);
    console.log(`✓ Added to ${COURTS[court]}: "${title}"`);
    break;
  }

  case 'status': {
    const [idx, status] = args;
    const validStatuses = ['pending','complied','partial','overdue'];
    if (!COURTS[court]) { console.error('Invalid court.'); process.exit(1); }
    if (!validStatuses.includes(status)) { console.error('Status must be: pending | complied | partial | overdue'); process.exit(1); }
    const i = parseInt(idx);
    if (isNaN(i) || i < 0 || i >= data[court].length) { console.error(`Index ${idx} out of range.`); process.exit(1); }
    data[court][i].status = status;
    save(data);
    console.log(`✓ ${COURTS[court]}[${i}] "${data[court][i].title}" → status: ${status}`);
    break;
  }

  case 'remove': {
    const [idx] = args;
    if (!COURTS[court]) { console.error('Invalid court.'); process.exit(1); }
    const i = parseInt(idx);
    if (isNaN(i) || i < 0 || i >= data[court].length) { console.error(`Index ${idx} out of range.`); process.exit(1); }
    const removed = data[court].splice(i, 1)[0];
    save(data);
    console.log(`✓ Removed from ${COURTS[court]}: "${removed.title}"`);
    break;
  }

  case 'export': {
    const outPath = path.join(__dirname, '..', `cases_export_${new Date().toISOString().slice(0,10)}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`✓ Exported to: ${outPath}`);
    break;
  }

  default:
    console.log(`
JAD Chambers — Case Data Manager
Usage:
  node update_cases.js list [court]
  node update_cases.js add <court> "<title>" "<casenum>" "<ldoh>" "<ndoh>" "<compliance>" [duedate]
  node update_cases.js status <court> <index> <pending|complied|partial|overdue>
  node update_cases.js remove <court> <index>
  node update_cases.js export

Courts: sc | hc | lc | tr
    `);
}
