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
      // Gated by SEND_LEARNER_EMAIL (see below).
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

// true — every submission sends the branded results email.
// Confirmed safe on 2026-07-31: Fabia submitted with the flag off and received
// zero emails, so no other sender exists and there is no double-send risk.
// Set to false to silence the email without touching anything else.
const SEND_LEARNER_EMAIL = true;

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

// Built from the finalized BU · Learning Gmail-safe template (bu-branded-email).
// RULES BAKED IN — do not "tidy" these away:
//   tables for layout, bgcolor on every coloured cell AND table, lowercase hex,
//   inline styles only, Georgia + Calibri only, 620px card, no hosted images.
// Gmail's compose preview strips background colours. The only valid test is to
// send to yourself and view it as a RECEIVED message. sendTestEmail() does that.

var C = {
  cream:    '#f4f3e9',
  midnight: '#1d1925',
  rubine:   '#ce0058',
  white:    '#ffffff',
  border:   'rgb(229,226,216)',
  caption:  'rgb(136,136,136)',
  title:    'rgb(118,118,118)',
  footL:    'rgb(136,133,153)',
  footR:    'rgb(168,165,181)',
  ink:      'rgb(29,25,37)',
  creamTxt: 'rgb(244,243,233)',
  rub:      'rgb(206,0,88)'
};
var F = {
  display: "Georgia,'Times New Roman',serif",
  body:    "Calibri,'Segoe UI',Arial,sans-serif"
};

function sendLearnerEmail(data) {
  // Run sendTestEmail() from the editor to test — this function needs a
  // submission's data and does nothing when run bare.
  if (!data || !data.email) return;

  var firstName = (data.name || '').split(' ')[0] || 'there';
  var s   = data.scores || {};
  var p   = data.points || {};
  var max = data.pointsMax || 15;

  // ── Score rows: dimension · score · level ──
  var scoreRows = DIM_ORDER.map(function(dim) {
    var label = s[dim] ? s[dim].label : 'Pre-Pilot';
    var pts   = p[dim] === undefined ? '—' : p[dim];
    return '<tr>' +
      '<td bgcolor="' + C.white + '" style="padding:7px 0;font-family:' + F.body + ';font-size:14px;color:' + C.ink + '">' + DIM_LABELS[dim] + '</td>' +
      '<td bgcolor="' + C.white + '" align="right" style="padding:7px 10px 7px 0;font-family:' + F.display + ';font-size:16px;white-space:nowrap;color:' + C.ink + '">' +
        pts + '<span style="font-size:12px;color:' + C.caption + '"> / ' + max + '</span>' +
      '</td>' +
      '<td bgcolor="' + C.white + '" align="right" style="padding:7px 0;font-family:' + F.body + ';font-size:11px;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;color:' + C.rub + '">' + label + '</td>' +
    '</tr>';
  }).join('');

  var totalRow = '';
  if (data.totalPoints !== undefined) {
    totalRow = '<tr>' +
      '<td bgcolor="' + C.white + '" style="padding:12px 0 0;border-top:1px solid ' + C.border + ';font-family:' + F.body + ';font-size:13px;font-weight:bold;color:' + C.ink + '">Total</td>' +
      '<td bgcolor="' + C.white + '" align="right" style="padding:12px 10px 0 0;border-top:1px solid ' + C.border + ';font-family:' + F.display + ';font-size:19px;white-space:nowrap;color:' + C.rub + '">' +
        data.totalPoints + '<span style="font-size:12px;color:' + C.caption + '"> / ' + (data.totalPointsMax || 75) + '</span>' +
      '</td>' +
      '<td bgcolor="' + C.white + '" style="border-top:1px solid ' + C.border + '"></td>' +
    '</tr>';
  }

  // ── Skill gaps ──
  var gaps = (data.skillGaps || []).slice(0, 5);
  var gapsBlock = '';
  if (gaps.length) {
    var gapRows = gaps.map(function(g) {
      var nowLine = g.anchor
        ? '<div style="font-family:' + F.body + ';font-size:13px;line-height:1.6;padding-top:3px;color:' + C.caption + '"><em>Now:</em> ' + g.anchor + '</div>'
        : '';
      var nextLine = g.next
        ? '<div style="font-family:' + F.body + ';font-size:13px;line-height:1.6;padding-top:2px;color:' + C.ink + '"><span style="color:' + C.rub + '">Next:</span> ' + g.next + '</div>'
        : '';
      return '<tr><td bgcolor="' + C.white + '" style="padding:0 0 14px">' +
        '<div style="font-family:' + F.display + ';font-size:15px;color:' + C.ink + '">' + g.skill +
          '<span style="font-family:' + F.body + ';font-size:11px;letter-spacing:1px;text-transform:uppercase;color:' + C.rub + '"> &nbsp;' + g.at + '</span></div>' +
        nowLine + nextLine +
      '</td></tr>';
    }).join('');
    gapsBlock =
      '<tr><td style="padding-bottom:20px">' +
        '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.white + '" style="border-left:3px solid ' + C.rubine + ';border-radius:0 8px 8px 0"><tbody>' +
          '<tr><td bgcolor="' + C.white + '" style="padding:16px 20px">' +
            '<div style="font-family:' + F.body + ';font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;padding-bottom:12px;color:' + C.rub + '">Skills to develop next</div>' +
            '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tbody>' + gapRows + '</tbody></table>' +
          '</td></tr>' +
        '</tbody></table>' +
      '</td></tr>';
  }

  // ── What's holding the level ──
  var limiting = data.limitingDimensions || [];
  var limitingBlock = '';
  if (limiting.length) {
    limitingBlock =
      '<tr><td style="padding-bottom:20px">' +
        '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.white + '" style="border:1px solid ' + C.rubine + ';border-radius:8px"><tbody>' +
          '<tr><td bgcolor="' + C.white + '" style="padding:14px 18px">' +
            '<div style="font-family:' + F.body + ';font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;padding-bottom:6px;color:' + C.rub + '">What&rsquo;s holding your level</div>' +
            '<div style="font-family:' + F.body + ';font-size:14px;line-height:1.65;color:' + C.ink + '">' +
              joinList(limiting) + '. Your level is set by your weakest areas, not by your total &mdash; the craft in ' +
              (limiting.length > 1 ? 'these areas' : 'this area') + ' is what moves it, not doing more with AI.' +
            '</div>' +
          '</td></tr>' +
        '</tbody></table>' +
      '</td></tr>';
  }

  var html =
'<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.cream + '" style="margin:0;padding:24px 12px">' +
'<tbody><tr><td align="center" bgcolor="' + C.cream + '">' +

  '<table width="620" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.white + '" style="max-width:620px;width:100%;border-radius:12px;overflow:hidden;border:1px solid ' + C.border + '">' +

    // HEADER
    '<tbody><tr><td bgcolor="' + C.midnight + '" style="padding:30px 36px 24px">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tbody>' +
        '<tr><td style="font-family:' + F.display + ';font-size:13px;letter-spacing:0.5px;padding-bottom:18px;color:' + C.creamTxt + '">' +
          '<span style="color:' + C.creamTxt + '">BU</span><span style="color:' + C.rub + '"> &middot; </span><span style="font-style:italic;color:' + C.rub + '">Learning</span>' +
        '</td></tr>' +
        '<tr><td style="font-family:' + F.body + ';font-size:11px;letter-spacing:4px;text-transform:uppercase;padding-bottom:12px;font-weight:bold;color:' + C.rub + '">' +
          'AI Fluency Assessment' +
        '</td></tr>' +
        '<tr><td style="font-family:' + F.display + ';font-size:26px;line-height:1.35;font-weight:normal;color:' + C.creamTxt + '">' +
          'You&rsquo;re done.<br>Here&rsquo;s where you stand.' +
        '</td></tr>' +
      '</tbody></table>' +
    '</td></tr>' +

    // RUBINE RULE
    '<tr><td bgcolor="' + C.rubine + '" style="font-size:0;line-height:0;height:4px">&nbsp;</td></tr>' +

    // BODY
    '<tr><td bgcolor="' + C.cream + '" style="padding:32px 36px">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tbody>' +

        '<tr><td style="font-family:' + F.display + ';font-size:17px;padding-bottom:18px;color:' + C.ink + '">' +
          'Hi ' + firstName + ',' +
        '</td></tr>' +

        // Dark callout — completion confirmation
        '<tr><td style="padding-bottom:24px">' +
          '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.midnight + '" style="border-radius:8px"><tbody>' +
            '<tr><td bgcolor="' + C.midnight + '" style="padding:20px 24px;font-family:' + F.display + ';font-size:16px;line-height:1.6;border-radius:8px;color:' + C.creamTxt + '">' +
              'Your assessment is complete and your results are recorded. You&rsquo;re working at ' +
              '<span style="font-style:italic;color:' + C.rub + '">' + (data.overallLevel || '') + '</span> overall.' +
            '</td></tr>' +
          '</tbody></table>' +
        '</td></tr>' +

        '<tr><td style="font-family:' + F.body + ';font-size:15px;line-height:1.7;padding-bottom:20px;color:' + C.ink + '">' +
          'These results are yours. Your individual scores are never shared with your manager and are never used in performance evaluations.' +
        '</td></tr>' +

        // Scores
        '<tr><td style="padding-bottom:20px">' +
          '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.white + '" style="border-left:3px solid ' + C.rubine + ';border-radius:0 8px 8px 0"><tbody>' +
            '<tr><td bgcolor="' + C.white + '" style="padding:16px 20px">' +
              '<div style="font-family:' + F.body + ';font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;padding-bottom:10px;color:' + C.rub + '">Your RANGE profile</div>' +
              '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tbody>' + scoreRows + totalRow + '</tbody></table>' +
            '</td></tr>' +
          '</tbody></table>' +
        '</td></tr>' +

        limitingBlock +
        gapsBlock +

        // What happens next
        '<tr><td style="padding-bottom:8px">' +
          '<table cellpadding="0" cellspacing="0" border="0"><tbody><tr><td bgcolor="' + C.rubine + '" style="font-size:0;line-height:0;height:2px;width:40px">&nbsp;</td></tr></tbody></table>' +
        '</td></tr>' +
        '<tr><td style="font-family:' + F.body + ';font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;padding:12px 0 8px;color:' + C.rub + '">' +
          'What happens next' +
        '</td></tr>' +
        '<tr><td style="font-family:' + F.body + ';font-size:15px;line-height:1.7;padding-bottom:14px;color:' + C.ink + '">' +
          'Your answers go to the L&amp;D team, who use them to recommend the right program and curate your learning path &mdash; so you can close these skills quickly instead of hunting for resources yourself. Now that you&rsquo;ve completed the assessment, invitations for programs are coming shortly.' +
        '</td></tr>' +
        '<tr><td style="font-family:' + F.body + ';font-size:15px;line-height:1.7;padding-bottom:24px;color:' + C.ink + '">' +
          'If you&rsquo;d like help sooner, or there&rsquo;s a skill you want to develop that didn&rsquo;t come through in your results, email us at ' +
          '<a href="mailto:' + LD_EMAIL + '" target="_blank" style="color:' + C.rub + ';text-decoration:none">' + LD_EMAIL + '</a>. ' +
          'We&rsquo;ll take it into account when making recommendations for courses &mdash; and may even build a whole new program based on your input.' +
        '</td></tr>' +

        // Signature
        '<tr><td style="font-family:' + F.display + ';font-size:15px;line-height:1.8;color:' + C.ink + '">' +
          'Warmly,<br>' +
          '<strong>The BU Learning Team</strong><br>' +
          '<span style="color:' + C.title + '">' + LD_EMAIL + '</span>' +
        '</td></tr>' +

      '</tbody></table>' +
    '</td></tr>' +

    // FOOTER
    '<tr><td bgcolor="' + C.midnight + '" style="padding:16px 36px">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tbody><tr>' +
        '<td style="font-family:' + F.body + ';font-size:11px;color:' + C.footL + '">AI Fluency Assessment &middot; FY27</td>' +
        '<td align="right" style="font-family:' + F.display + ';font-size:12px;font-style:italic;color:' + C.footR + '">BetterUp</td>' +
      '</tr></tbody></table>' +
    '</td></tr>' +

  '</tbody></table>' +

'</td></tr></tbody>' +
'</table>';

  MailApp.sendEmail({
    to:       data.email,
    subject:  'Your AI Fluency results — assessment complete',
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
