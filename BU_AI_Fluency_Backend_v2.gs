// ── BU AI Fluency Assessment — Apps Script Backend (v2) ───────────────────────
//
// Written against the LIVE deployed script Fabia provided, not the copy in
// baseline/ — the two had diverged. Preserved from the live version:
//   • doGet() serving the page as a GAS HTML template (do not change this —
//     it is what makes GAS_URL resolve; see note below)
//   • getOrCreateSheet() with RESULTS_SHEET_ID in Script Properties, writing to
//     a separate spreadsheet rather than the container
//
// GAS_URL: RESOLVED. Because doGet() calls createTemplateFromFile('index')
// .evaluate(), the page IS served as a template, so
// '<?= ScriptApp.getService().getUrl() ?>' evaluates and submissions post
// correctly. The silent-submission-loss risk flagged earlier does not apply to
// this deployment. The one requirement is that the HTML file remain named
// `index` in the Apps Script project.
//
// NEW IN v2:
//   • sendLearnerEmail(). The live script had no MailApp/GmailApp call, so no
//     results email was being sent. This adds it.
//   • 'Responses v2' tab. The v1 schema stored course names, AFS eligibility,
//     skill priorities and per-level averages — none of which v2 produces. A new
//     tab keeps existing data intact rather than writing mismatched columns
//     under v1 headers.
//   • Scores: 0–15 per dimension, 0–75 total, plus one column per question.
//   • Reminder handling removed — the retake is out of scope.
//
// SETUP:
//   1. Paste over the existing script (keep the HTML file named `index`)
//   2. Deploy → Manage deployments → ✏ Edit → New version → Deploy
//   3. Submit one test response and confirm a row lands in 'Responses v2'
//      and the email arrives
//   4. Optional trigger: triggerWeeklyDigest → Time-driven → Week timer (Monday)

var RESPONSES_SHEET = 'Responses v2';
var LD_EMAIL        = 'BU.Learning@BetterUp.co';

var DIM_ORDER  = ['reach', 'autonomy', 'navigation', 'generalization', 'execution'];
var DIM_LABELS = {
  reach: 'Reach', autonomy: 'Autonomy', navigation: 'Navigation',
  generalization: 'Generalization', execution: 'Execution Fidelity'
};
var LEVEL_COLORS = {
  'Pre-Pilot': '#8B8A96', 'Pilot': '#CE0058',
  'Builder': '#7B5EA7', 'Multiplier': '#2E7D52'
};

// ── Entry points ───────────────────────────────────────────────────────────────

// Unchanged from the live script. Serving as a template is load-bearing.
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('BetterUp AI Fluency Framework')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    handleAssessment(data);
    // Email failure must not lose the response — the row is already written.
    try {
      sendLearnerEmail(data);
    } catch (mailErr) {
      Logger.log('Email failed for ' + (data.email || '?') + ': ' + mailErr.message);
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
  var sheet = getOrCreateSheet(RESPONSES_SHEET);

  var s       = data.scores || {};
  var p       = data.points || {};
  var answers = data.answers || [];

  ensureHeaders(sheet, answers);

  var row = [
    data.timestamp || new Date().toISOString(),
    data.name  || '',
    data.email || '',
    data['function'] || '',
    data.subfunction || '',
    data.tool  || '',
    data.peopleManager === true ? 'Yes' : data.peopleManager === false ? 'No' : '',
    // Overall comes straight from the page's gated calculation. Not re-derived
    // here: v1 recomputed it from an average, which is exactly the scoring the
    // rebuild removed.
    data.overallLevel || '',
    data.totalPoints    === undefined ? '' : data.totalPoints,
    data.totalPointsMax === undefined ? '' : data.totalPointsMax
  ];
  DIM_ORDER.forEach(function(dim) {
    row.push(s[dim] ? s[dim].label : '');
    row.push(p[dim] === undefined ? '' : p[dim]);
  });
  row.push((data.limitingDimensions || []).join(', '));
  row.push((data.skillGaps || []).map(function(g) {
    return g.skill + ' (' + g.at + ')';
  }).join(' | '));
  // One column per question — this is what lets gaps be counted across the
  // population, which is the input for designing the new programmes.
  answers.forEach(function(a) { row.push(a.choice); });

  sheet.appendRow(row);
}

function v2Headers(answers) {
  var headers = [
    'Timestamp', 'Name', 'Email', 'Team', 'Sub-Team', 'AI Tool', 'People Manager',
    'Overall Level', 'Total Score', 'Total Max'
  ];
  DIM_ORDER.forEach(function(dim) {
    headers.push(DIM_LABELS[dim] + ' Level');
    headers.push(DIM_LABELS[dim] + ' Score (0-15)');
  });
  headers.push('Limiting Dimensions', 'Skill Gaps');
  (answers || []).forEach(function(a) { headers.push(a.id + ' — ' + a.skill); });
  return headers;
}

// Preserved from the live script: separate spreadsheet, id in Script Properties.
function getOrCreateSheet(sheetName) {
  var props = PropertiesService.getScriptProperties();
  var ssId  = props.getProperty('RESULTS_SHEET_ID');

  var ss = null;
  if (ssId) {
    try { ss = SpreadsheetApp.openById(ssId); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('AI Fluency Assessment — Responses');
    props.setProperty('RESULTS_SHEET_ID', ss.getId());
  }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Headers are written on the first submission, once the question set is known.
function ensureHeaders(sheet, answers) {
  if (sheet.getLastRow() > 0) return;
  var headers = v2Headers(answers);
  sheet.appendRow(headers);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1D1925')
    .setFontColor('#F4F3E9');
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(3, 220);
}

// ── Learner email ──────────────────────────────────────────────────────────────

// "A, B and C" rather than "A and B and C".
function joinList(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

function sendLearnerEmail(data) {
  if (!data.email) return;

  var firstName = (data.name || '').split(' ')[0] || 'there';
  var s   = data.scores || {};
  var p   = data.points || {};
  var max = data.pointsMax || 15;

  var scoresHTML = DIM_ORDER.map(function(dim) {
    var label = s[dim] ? s[dim].label : 'Pre-Pilot';
    var color = LEVEL_COLORS[label] || '#8B8A96';
    var pts   = p[dim] === undefined ? '—' : p[dim];
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

  var totalHTML = '';
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

  var limiting = data.limitingDimensions || [];
  var limitingHTML = '';
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

  var gaps = (data.skillGaps || []).slice(0, 6);
  var gapsHTML = gaps.length
    ? gaps.map(function(g) {
        var nextLine = g.next
          ? '<div style="font-size:13px;color:#1a1a2e;line-height:1.55;margin-top:5px;">' +
              '<span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#CE0058;">Next: </span>' + g.next +
            '</div>'
          : '';
        return '<div style="margin-bottom:12px;padding:16px 18px;background:#f9f9f9;border-radius:8px;border:1px solid #efefef;">' +
          '<div style="font-size:14px;font-weight:600;color:#1a1a2e;margin-bottom:6px;">' + g.skill +
            ' <span style="font-size:11px;font-weight:400;color:#999;">· ' + g.at + '</span></div>' +
          '<div style="font-size:13px;color:#666;line-height:1.55;">' +
            '<span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#999;">Now: </span>' + (g.anchor || '') +
          '</div>' + nextLine +
        '</div>';
      }).join('')
    : '<div style="font-size:13px;color:#666;line-height:1.6;">Your answers were consistent across all five dimensions — no single skill stands out as a gap relative to the rest of your practice.</div>';

  var html =
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

// ── Utilities ──────────────────────────────────────────────────────────────────

function getSheetUrl() {
  var id = PropertiesService.getScriptProperties().getProperty('RESULTS_SHEET_ID');
  if (id) Logger.log(SpreadsheetApp.openById(id).getUrl());
  else Logger.log('No sheet yet — complete an assessment first.');
}

// Run once to confirm the email renders and sends before launch. Uses a
// representative payload; sends to whoever runs it.
function sendTestEmail() {
  var me = Session.getActiveUser().getEmail();
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

// ── Weekly digest to L&D ───────────────────────────────────────────────────────
// The aggregate view is the primary deliverable: where the gaps concentrate is
// what the new programmes get designed from.

function triggerWeeklyDigest() {
  var props = PropertiesService.getScriptProperties();
  var ssId  = props.getProperty('RESULTS_SHEET_ID');
  if (!ssId) return;

  var ss    = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(RESPONSES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return;

  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var values  = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = values.slice(1).filter(function(r) { return new Date(r[0]) >= oneWeekAgo; });
  if (rows.length === 0) return;

  var col = function(name) { return headers.indexOf(name); };
  var avg = function(idx) {
    var vals = rows.map(function(r) { return Number(r[idx]); })
                   .filter(function(v) { return !isNaN(v); });
    return vals.length
      ? (vals.reduce(function(a, b) { return a + b; }, 0) / vals.length).toFixed(1)
      : 'n/a';
  };
  var tally = function(idx, sep) {
    var counts = {};
    rows.forEach(function(r) {
      String(r[idx] || '').split(sep).forEach(function(v) {
        v = v.trim();
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
    });
    return counts;
  };
  var rank = function(counts, limit) {
    var keys = Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; });
    if (limit) keys = keys.slice(0, limit);
    return keys.map(function(k) { return '  ' + counts[k] + '× ' + k; }).join('\n') || '  none';
  };

  var scoreLines = DIM_ORDER.map(function(dim) {
    var i = col(DIM_LABELS[dim] + ' Score (0-15)');
    return '  ' + DIM_LABELS[dim] + ': ' + (i > -1 ? avg(i) : 'n/a') + ' / 15';
  }).join('\n');

  var body =
    'New submissions this week: ' + rows.length + '\n\n' +
    'Average score per dimension:\n' + scoreLines + '\n\n' +
    'Overall level distribution:\n' + rank(tally(col('Overall Level'), ',')) + '\n\n' +
    'Dimensions holding people back:\n' + rank(tally(col('Limiting Dimensions'), ',')) + '\n\n' +
    'Most common skill gaps:\n' + rank(tally(col('Skill Gaps'), '|'), 12) + '\n\n' +
    'Teams:\n' + rank(tally(3, ',')) + '\n\n' +
    'Full data: ' + ss.getUrl();

  MailApp.sendEmail({
    to:      LD_EMAIL,
    subject: 'BU AI Fluency — Weekly Digest (' + rows.length + ' new submissions)',
    body:    body
  });
}
