// ── BU AI Fluency Assessment — Apps Script Backend ────────────────────────────
//
// RECONCILED with the live deployed script. This is Fabia's version plus
// additions — nothing of hers was removed or renamed, so anything downstream of
// the 'Responses' tab keeps working.
//
// WHAT IS UNCHANGED FROM YOUR VERSION
//   doGet, doPost, handleReminder, getOrCreateSheet, setupResponsesSheet,
//   setupRemindersSheet, getOverallLabel, getSheetUrl, addDimAvgHeaders —
//   all byte-identical in behaviour. Same 'Responses' tab, same 43 columns in
//   the same order, same 'Reminders' tab.
//
// WHAT WAS ADDED
//   1. sendLearnerEmail(). Your version has no MailApp/GmailApp call anywhere,
//      so no results email was being sent from this script. This adds one.
//      Run sendTestEmail() once to check it before anyone else sees it.
//   2. 24 new columns appended after AQ, so v2's scores and skill gaps are
//      captured: total score, per-dimension score, limiting dimensions, skill
//      gaps, and one column per question. Existing columns A–AQ untouched.
//   3. ensureV2Headers() — adds those headers to your existing sheet on the
//      next submission, without touching existing rows.
//
// NOTE ON COLUMNS X–AQ (the 20 "Avg" columns)
//   The v2 page still sends dimAvgs, so these keep filling. But the meaning
//   changed: the value is now HOW MANY of that dimension's answers landed at
//   that level, not an average rating. Run renameDimCountHeaders() once to
//   relabel them accurately. Left as-is by default in case you have formulas
//   referencing the current header text.
//
// NOTE ON COURSE COLUMNS S–V
//   v2 makes no course recommendations, so these write blank. No error —
//   `data.courses || []` handles it.

// ── Entry points ───────────────────────────────────────────────────────────────

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('BetterUp AI Fluency Framework')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'reminder') {
      handleReminder(data);
    } else {
      handleAssessment(data);
      // OFF BY DEFAULT — see SEND_LEARNER_EMAIL below. Learners are already
      // receiving an email from somewhere, and turning this on before that
      // sender is identified would send two.
      if (SEND_LEARNER_EMAIL) {
        // Wrapped separately: a mail failure must never lose a response that
        // has already been written to the sheet.
        try {
          sendLearnerEmail(data);
        } catch (mailErr) {
          Logger.log('Email failed for ' + (data.email || '?') + ': ' + mailErr.message);
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Sheet write ────────────────────────────────────────────────────────────────

function handleAssessment(data) {
  const sheet = getOrCreateSheet('Responses');

  const sp = data.skillPriorities || [];
  const courses = data.courses || [];
  const fn = data['function'] || '';
  const da = data.dimAvgs || {};

  const afsLabels = {
    recommended: 'Eligible — Apply for AFS Next',
    teaser:      'Getting Close — 1–2 Dims Needed',
    not_yet:     'Not Yet — Build Foundation First'
  };
  const afsLabel = afsLabels[data.afsNextStatus] || data.afsNextStatus || '';

  const avg = (dim, level) => (da[dim] && da[dim][level] !== undefined) ? da[dim][level] : '';

  // ── v2 additions ──
  const answers = data.answers || [];
  const p = data.points || {};
  ensureV2Headers(sheet, answers);

  const v2Cols = [
    data.totalPoints    === undefined ? '' : data.totalPoints,
    data.totalPointsMax === undefined ? '' : data.totalPointsMax,
    p.reach          === undefined ? '' : p.reach,
    p.autonomy       === undefined ? '' : p.autonomy,
    p.navigation     === undefined ? '' : p.navigation,
    p.generalization === undefined ? '' : p.generalization,
    p.execution      === undefined ? '' : p.execution,
    (data.limitingDimensions || []).join(', '),
    (data.skillGaps || []).map(function(g) { return g.skill + ' (' + g.at + ')'; }).join(' | ')
  ].concat(answers.map(function(a) { return a.choice; }));

  sheet.appendRow([
    // A–G: Identity
    data.timestamp,
    data.name,
    data.email,
    fn,
    data.subfunction || '',
    data.tool || '',
    data.peopleManager === true ? 'Yes' : data.peopleManager === false ? 'No' : '',
    // H–L: RANGE level labels
    data.scores.reach.label,
    data.scores.autonomy.label,
    data.scores.navigation.label,
    data.scores.generalization.label,
    data.scores.execution.label,
    // M–O: Summary
    data.avgLevel,
    // Prefer the page's gated overall level when present; fall back to your
    // average-derived label so older payloads still work.
    data.overallLevel || getOverallLabel(data.avgLevel),
    (data.gapDimensions || []).join(', '),
    // P–R: Skill priorities
    sp[0] || '',
    sp[1] || '',
    sp[2] || '',
    // S–V: Courses (blank in v2 — no course recommendations)
    courses[0] ? courses[0].name : '',
    courses[1] ? courses[1].name : '',
    courses[2] ? courses[2].name : '',
    courses[3] ? courses[3].name : '',
    // W: AFS eligibility
    afsLabel,
    // X–AA: Reach per-level counts
    avg('reach', 0), avg('reach', 1), avg('reach', 2), avg('reach', 3),
    // AB–AE: Autonomy
    avg('autonomy', 0), avg('autonomy', 1), avg('autonomy', 2), avg('autonomy', 3),
    // AF–AI: Navigation
    avg('navigation', 0), avg('navigation', 1), avg('navigation', 2), avg('navigation', 3),
    // AJ–AM: Generalization
    avg('generalization', 0), avg('generalization', 1), avg('generalization', 2), avg('generalization', 3),
    // AN–AQ: Execution
    avg('execution', 0), avg('execution', 1), avg('execution', 2), avg('execution', 3)
  ].concat(v2Cols));  // AR onwards: v2 scores, gaps, and per-question answers
}

function handleReminder(data) {
  const sheet = getOrCreateSheet('Reminders');
  sheet.appendRow([
    new Date().toISOString(),
    data.name,
    data.email,
    data.retakeDate
  ]);
}

function getOrCreateSheet(sheetName) {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('RESULTS_SHEET_ID');

  let ss;
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (e) {
      ss = null;
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.create('AI Fluency Assessment — Responses');
    props.setProperty('RESULTS_SHEET_ID', ss.getId());
    setupResponsesSheet(ss.getActiveSheet());
  }

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Responses') {
      setupResponsesSheet(sheet);
    } else if (sheetName === 'Reminders') {
      setupRemindersSheet(sheet);
    }
  }

  return sheet;
}

function setupResponsesSheet(sheet) {
  sheet.setName('Responses');
  sheet.appendRow([
    'Timestamp', 'Name', 'Email', 'Team', 'Sub-Team', 'AI Tool', 'People Manager',
    'R — Reach', 'A — Autonomy', 'N — Navigation', 'G — Generalization', 'E — Execution Fidelity',
    'Avg RANGE Score', 'Overall Level', 'Gap Dimensions',
    'Skill Priority 1', 'Skill Priority 2', 'Skill Priority 3',
    'Skills Course 1', 'Skills Course 2', 'Function Course 1', 'Function Course 2',
    'AFS Next Eligibility',
    'R Pre-Pilot Avg', 'R Pilot Avg', 'R Builder Avg', 'R Multiplier Avg',
    'A Pre-Pilot Avg', 'A Pilot Avg', 'A Builder Avg', 'A Multiplier Avg',
    'N Pre-Pilot Avg', 'N Pilot Avg', 'N Builder Avg', 'N Multiplier Avg',
    'G Pre-Pilot Avg', 'G Pilot Avg', 'G Builder Avg', 'G Multiplier Avg',
    'E Pre-Pilot Avg', 'E Pilot Avg', 'E Builder Avg', 'E Multiplier Avg'
  ]);
  sheet.setFrozenRows(1);
}

function setupRemindersSheet(sheet) {
  sheet.setName('Reminders');
  sheet.appendRow(['Logged At', 'Name', 'Email', 'Retake Date']);
  sheet.setFrozenRows(1);
}

function getOverallLabel(avg) {
  if (avg < 0.5) return 'Pre-Pilot';
  if (avg < 1.5) return 'Pilot';
  if (avg < 2.5) return 'Builder';
  return 'Multiplier';
}

// ── v2 columns (appended after AQ) ─────────────────────────────────────────────

// Adds the v2 headers once, in place, without touching existing rows. Safe to
// call on every submission — it returns immediately if they are already there.
function ensureV2Headers(sheet, answers) {
  if (sheet.getLastRow() === 0) return;              // setupResponsesSheet handles a fresh sheet
  const lastCol = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (existing.indexOf('Total Score') > -1) return;  // already migrated

  const headers = [
    'Total Score', 'Total Max',
    'R Score (0-15)', 'A Score (0-15)', 'N Score (0-15)',
    'G Score (0-15)', 'E Score (0-15)',
    'Limiting Dimensions', 'Skill Gaps'
  ].concat((answers || []).map(function(a) { return a.id + ' — ' + a.skill; }));

  sheet.getRange(1, lastCol + 1, 1, headers.length).setValues([headers]);
  Logger.log('v2 headers added from column ' + (lastCol + 1));
}

// Optional, run once. Columns X–AQ now hold counts, not averages — this makes
// the labels say so. Skip it if you have formulas referencing the old text.
function renameDimCountHeaders() {
  const id = PropertiesService.getScriptProperties().getProperty('RESULTS_SHEET_ID');
  if (!id) { Logger.log('No sheet found.'); return; }
  const sheet = SpreadsheetApp.openById(id).getSheetByName('Responses');
  if (!sheet) { Logger.log('No Responses tab.'); return; }
  const renamed = [];
  ['R', 'A', 'N', 'G', 'E'].forEach(function(d) {
    ['Pre-Pilot', 'Pilot', 'Builder', 'Multiplier'].forEach(function(l) {
      renamed.push(d + ' answers at ' + l);
    });
  });
  sheet.getRange(1, 24, 1, 20).setValues([renamed]);  // X..AQ
  Logger.log('Renamed columns X–AQ to answer counts.');
}

// ── Learner email (NEW — your version sent none) ───────────────────────────────

// ── SET THIS DELIBERATELY ──────────────────────────────────────────────────────
//
// false (default) — this script sends no email. The existing sender, whatever it
//                   is, keeps working exactly as it does today. Nothing changes
//                   for learners.
// true            — this script sends the v2 results email with scores and skill
//                   gaps. Only set this once you have confirmed nothing else is
//                   sending one, or learners will receive two.
//
// Run auditEmailSenders() below to find the existing sender.
const SEND_LEARNER_EMAIL = false;

const LD_EMAIL = 'BU.Learning@BetterUp.co';

const DIM_ORDER  = ['reach', 'autonomy', 'navigation', 'generalization', 'execution'];
const DIM_LABELS = {
  reach: 'Reach', autonomy: 'Autonomy', navigation: 'Navigation',
  generalization: 'Generalization', execution: 'Execution Fidelity'
};
const LEVEL_COLORS = {
  'Pre-Pilot': '#8B8A96', 'Pilot': '#CE0058',
  'Builder': '#7B5EA7', 'Multiplier': '#2E7D52'
};

// "A, B and C" rather than "A and B and C".
function joinList(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

function sendLearnerEmail(data) {
  if (!data.email) return;

  const firstName = (data.name || '').split(' ')[0] || 'there';
  const s   = data.scores || {};
  const p   = data.points || {};
  const max = data.pointsMax || 15;

  const scoresHTML = DIM_ORDER.map(function(dim) {
    const label = s[dim] ? s[dim].label : 'Pre-Pilot';
    const color = LEVEL_COLORS[label] || '#8B8A96';
    const pts   = p[dim] === undefined ? '—' : p[dim];
    return '<tr>' +
      '<td style="padding:10px 0;font-size:14px;color:#444;border-bottom:1px solid #f0f0f0;">' + DIM_LABELS[dim] + '</td>' +
      '<td style="padding:10px 8px;text-align:right;border-bottom:1px solid #f0f0f0;white-space:nowrap;">' +
        '<span style="font-size:15px;font-weight:700;color:#1a1a2e;">' + pts + '</span>' +
        '<span style="font-size:12px;color:#999;"> / ' + max + '</span>' +
      '</td>' +
      '<td style="padding:10px 0;text-align:right;border-bottom:1px solid #f0f0f0;width:110px;">' +
        '<span style="display:inline-block;background:' + color + ';color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.04em;">' + label + '</span>' +
      '</td>' +
    '</tr>';
  }).join('');

  let totalHTML = '';
  if (data.totalPoints !== undefined) {
    totalHTML =
      '<tr>' +
        '<td style="padding:14px 0 0;font-size:13px;font-weight:700;color:#1a1a2e;">Total</td>' +
        '<td style="padding:14px 8px 0;text-align:right;white-space:nowrap;">' +
          '<span style="font-size:18px;font-weight:700;color:#CE0058;">' + data.totalPoints + '</span>' +
          '<span style="font-size:12px;color:#999;"> / ' + (data.totalPointsMax || 75) + '</span>' +
        '</td><td></td>' +
      '</tr>';
  }

  const limiting = data.limitingDimensions || [];
  let limitingHTML = '';
  if (limiting.length) {
    limitingHTML =
      '<div style="margin:0 32px 24px;padding:16px 20px;background:#fdf2f6;border:1px solid #f5d0de;border-radius:8px;">' +
        '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#CE0058;margin-bottom:6px;">What\'s holding your level</div>' +
        '<div style="font-size:13px;color:#555;line-height:1.6;">' +
          joinList(limiting) + '. You\'re working at <strong>' + (data.overallLevel || '') +
          '</strong> overall — the craft in ' + (limiting.length > 1 ? 'these areas' : 'this area') +
          ' is what moves that, not doing more with AI.' +
        '</div>' +
      '</div>';
  }

  const gaps = (data.skillGaps || []).slice(0, 6);
  const gapsHTML = gaps.length
    ? gaps.map(function(g) {
        const nextLine = g.next
          ? '<div style="font-size:13px;color:#1a1a2e;line-height:1.55;margin-top:5px;">' +
              '<span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#CE0058;">Next: </span>' + g.next +
            '</div>'
          : '';
        return '<div style="margin-bottom:12px;padding:16px 18px;background:#f9f9f9;border-radius:8px;border:1px solid #efefef;">' +
          '<div style="font-size:14px;font-weight:600;color:#1a1a2e;margin-bottom:6px;">' + g.skill +
            ' <span style="font-size:11px;font-weight:400;color:#999;">· ' + g.at + '</span></div>' +
          (g.anchor ? '<div style="font-size:13px;color:#666;line-height:1.55;">' +
            '<span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#999;">Now: </span>' + g.anchor +
          '</div>' : '') + nextLine +
        '</div>';
      }).join('')
    : '<div style="font-size:13px;color:#666;line-height:1.6;">Your answers were consistent across all five dimensions — no single skill stands out as a gap relative to the rest of your practice.</div>';

  const html =
    '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;background:#fff;">' +

    '<div style="background:#1D1925;padding:32px;">' +
      '<div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#CE0058;margin-bottom:8px;">BU Learning</div>' +
      '<div style="font-size:24px;font-weight:700;color:#F4F3E9;line-height:1.2;">Your AI Fluency Results</div>' +
    '</div>' +

    '<div style="padding:32px 32px 0;">' +
      '<p style="font-size:16px;color:#1a1a2e;margin:0 0 10px;font-weight:600;">Hi ' + firstName + ',</p>' +
      '<p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Here\'s your BU AI Fluency Assessment summary. These results are yours — your individual scores stay private and are never shared with your manager or used in performance evaluations.</p>' +
    '</div>' +

    '<div style="padding:28px 32px 0;">' +
      '<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#999;margin-bottom:14px;">Your RANGE Profile</div>' +
      '<table style="width:100%;border-collapse:collapse;">' + scoresHTML + totalHTML + '</table>' +
      '<p style="font-size:12px;color:#999;line-height:1.6;margin:14px 0 0;">Your level is set by your weakest areas, not by your total — a strong score in one dimension doesn\'t carry the others.</p>' +
    '</div>' +

    '<div style="height:1px;background:#f0f0f0;margin:28px 32px;"></div>' +

    limitingHTML +

    '<div style="padding:0 32px 8px;">' +
      '<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#999;margin-bottom:14px;">Skills to Develop Next</div>' +
      gapsHTML +
    '</div>' +

    '<div style="margin:20px 32px 32px;padding:20px 24px;background:#fdf2f6;border:1px solid #f5d0de;border-radius:8px;">' +
      '<div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#CE0058;margin-bottom:10px;">What happens next</div>' +
      '<p style="font-size:13px;color:#444;line-height:1.7;margin:0 0 10px;">Your answers go to the L&amp;D team, who use them to recommend the right program and curate your learning path — so you can close these skills quickly instead of hunting for resources yourself. Now that you\'ve completed the assessment, invitations for programs are coming shortly.</p>' +
      '<p style="font-size:13px;color:#555;line-height:1.7;margin:0;">If you\'d like help sooner, or there\'s a skill you want to develop that didn\'t come through in your results, email the BU Learning team at <a href="mailto:' + LD_EMAIL + '" style="color:#CE0058;text-decoration:none;">' + LD_EMAIL + '</a>. The team will take it into account when making recommendations for courses — and may even build a whole new program based on your input.</p>' +
    '</div>' +

    '<div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #efefef;">' +
      '<div style="font-size:12px;color:#999;">Questions about your results or next steps?</div>' +
      '<div style="font-size:12px;color:#999;margin-top:4px;">Reach out to <a href="mailto:' + LD_EMAIL + '" style="color:#CE0058;text-decoration:none;">' + LD_EMAIL + '</a></div>' +
    '</div>' +

    '</div>';

  MailApp.sendEmail({
    to:       data.email,
    subject:  'Your BU AI Fluency Results — ' + (data.name || ''),
    htmlBody: html
  });
}

// ── Utilities (yours, unchanged) ───────────────────────────────────────────────

// Run once after first deploy to confirm the sheet URL
function getSheetUrl() {
  const id = PropertiesService.getScriptProperties().getProperty('RESULTS_SHEET_ID');
  if (id) Logger.log(SpreadsheetApp.openById(id).getUrl());
  else Logger.log('No sheet yet — complete an assessment first.');
}

// ── Diagnostic: what is emailing the learners? ─────────────────────────────────
// Run this from THIS project, then run it again from the Sheet's bound script
// (Extensions → Apps Script). It lists every trigger, which is where an
// automatic email almost always comes from.
function auditEmailSenders() {
  const out = [];
  out.push('=== Triggers in this project ===');
  const triggers = ScriptApp.getProjectTriggers();
  if (!triggers.length) {
    out.push('  none');
  } else {
    triggers.forEach(function(t) {
      out.push('  function: ' + t.getHandlerFunction() +
               '  |  event: ' + t.getEventType() +
               '  |  source: ' + t.getTriggerSource());
    });
  }

  out.push('');
  out.push('=== Results spreadsheet ===');
  const id = PropertiesService.getScriptProperties().getProperty('RESULTS_SHEET_ID');
  if (id) {
    const ss = SpreadsheetApp.openById(id);
    out.push('  ' + ss.getName());
    out.push('  ' + ss.getUrl());
    out.push('  tabs: ' + ss.getSheets().map(function(sh) { return sh.getName(); }).join(', '));
  } else {
    out.push('  RESULTS_SHEET_ID not set');
  }

  out.push('');
  out.push('=== Daily mail quota remaining ===');
  // If something in YOUR account has been sending, this is well below the cap.
  out.push('  ' + MailApp.getRemainingDailyQuota() + ' of 1500 (Workspace)');
  out.push('  A number well below 1500 means this account has already sent mail today.');

  out.push('');
  out.push('=== Cannot be read by script — check the UI ===');
  out.push('  1. Left sidebar of this editor: how many .gs files? Open each and');
  out.push('     search for MailApp, GmailApp, or sendEmail.');
  out.push('  2. The Sheet → Tools → Notification rules (these email on change).');
  out.push('  3. The Sheet → Extensions → Apps Script: its own files and triggers.');
  out.push('  4. Any Zapier / Make / Workspace add-on watching the Sheet.');

  Logger.log(out.join('\n'));
}

// Run once to check the email renders and sends, before any learner sees it.
function sendTestEmail() {
  const me = Session.getActiveUser().getEmail();
  sendLearnerEmail({
    name: 'Test Learner', email: me,
    overallLevel: 'Pilot', totalPoints: 42, totalPointsMax: 75, pointsMax: 15,
    scores: {
      reach: { label: 'Builder' }, autonomy: { label: 'Pilot' },
      navigation: { label: 'Pilot' }, generalization: { label: 'Pre-Pilot' },
      execution: { label: 'Pilot' }
    },
    points: { reach: 11, autonomy: 8, navigation: 9, generalization: 5, execution: 9 },
    limitingDimensions: ['GENERALIZATION'],
    skillGaps: [{
      skill: 'Consequence design — adoption asymmetry', at: 'Pre-Pilot',
      anchor: 'I told the people who were directly affected.',
      next: 'I checked whether the people who hand work to me could keep up.'
    }]
  });
  Logger.log('Test email sent to ' + me);
}

// Run this once to add the 20 dimAvg header columns to an existing sheet
// without destroying existing data rows
function addDimAvgHeaders() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('RESULTS_SHEET_ID');
  if (!ssId) { Logger.log('No sheet found.'); return; }
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName('Responses');
  if (!sheet) { Logger.log('No Responses tab.'); return; }
  const newHeaders = [
    'R Pre-Pilot Avg', 'R Pilot Avg', 'R Builder Avg', 'R Multiplier Avg',
    'A Pre-Pilot Avg', 'A Pilot Avg', 'A Builder Avg', 'A Multiplier Avg',
    'N Pre-Pilot Avg', 'N Pilot Avg', 'N Builder Avg', 'N Multiplier Avg',
    'G Pre-Pilot Avg', 'G Pilot Avg', 'G Builder Avg', 'G Multiplier Avg',
    'E Pre-Pilot Avg', 'E Pilot Avg', 'E Builder Avg', 'E Multiplier Avg'
  ];
  const lastCol = sheet.getLastColumn();
  sheet.getRange(1, lastCol + 1, 1, newHeaders.length).setValues([newHeaders]);
  Logger.log('Headers added. New last column: ' + (lastCol + newHeaders.length));
}
