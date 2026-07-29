// ── BU AI Fluency Assessment — Apps Script Backend (v2) ───────────────────────
// SETUP (one-time):
//   1. Open this project in Google Apps Script (script.google.com)
//   2. Deploy → New deployment → Web App
//      • Execute as: Me
//      • Who has access: Anyone
//   3. Copy the deployment URL into BU_AI_Fluency_v2.html:
//        const GAS_URL = '';   ← paste URL here
//      IMPORTANT: if the page is NOT served as a GAS HTML template, the
//      '<?= ScriptApp.getService().getUrl() ?>' expression stays a literal
//      string, fetch() fails, and the .catch(() => {}) swallows it silently.
//      Submit one live test response and confirm a row appears before launch.
//   4. Re-deploy after every edit (Deploy → Manage deployments → ✏ Edit)
//
// TRIGGER to add in Apps Script → Triggers:
//   • triggerWeeklyDigest → Time-driven → Week timer (Monday)
//
// CHANGES FROM v1:
//   • Scores. Each answer is a rung on a 6-step behavioural ladder, so the sum
//     is a real count of demonstrated behaviour: 0–15 per dimension, 0–75 total.
//     Reported to the learner and written to the sheet.
//   • No course recommendations, no AFS eligibility, no retake reminder — the
//     retake is out of scope and programmes are not named to learners.
//   • Skill gaps replace courses: the named skill, what the learner does now,
//     and the next rung up.
//   • Sheet carries all 15 answers so gaps can be analysed across the population.
//   • logReminder / sendDueReminders removed along with the Retake Reminders tab.

var SHEET_NAME = 'Fluency Results v2';
var LD_EMAIL   = 'BU.Learning@BetterUp.co';

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

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    appendToSheet(data);
    sendLearnerEmail(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('BU AI Fluency backend v2 is live.');
}

// ── Google Sheet ───────────────────────────────────────────────────────────────

function appendToSheet(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  var answers = data.answers || [];

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = [
      'Timestamp', 'Name', 'Email', 'Team', 'Primary AI Tool', 'People Manager',
      'Overall Level', 'Total Score', 'Total Max'
    ];
    DIM_ORDER.forEach(function(dim) {
      headers.push(DIM_LABELS[dim] + ' Level');
      headers.push(DIM_LABELS[dim] + ' Score');
    });
    headers.push('Limiting Dimensions', 'Skill Gaps');
    // One column per question, so gaps can be counted across the population.
    answers.forEach(function(a) { headers.push(a.id + ' — ' + a.skill); });

    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1D1925')
      .setFontColor('#F4F3E9');
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(3, 220);
  }

  var s = data.scores || {};
  var p = data.points || {};

  var row = [
    data.timestamp || new Date().toISOString(),
    data.name  || '',
    data.email || '',
    data.function || '',
    data.tool  || '',
    data.peopleManager ? 'Yes' : 'No',
    data.overallLevel || '',
    data.totalPoints === undefined ? '' : data.totalPoints,
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
  answers.forEach(function(a) { row.push(a.choice); });

  sheet.appendRow(row);
}

// ── Learner email ──────────────────────────────────────────────────────────────

// "A, B and C" rather than "A and B and C".
function joinList(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

function sendLearnerEmail(data) {
  var firstName = (data.name || '').split(' ')[0] || 'there';
  var s   = data.scores || {};
  var p   = data.points || {};
  var max = data.pointsMax || 15;

  // ── Score rows: level and score per dimension ──
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
        '</td>' +
        '<td></td>' +
      '</tr>';
  }

  // ── What's holding the level ──
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

  // ── Skills to develop next ──
  var gaps = (data.skillGaps || []).slice(0, 6);
  var gapsHTML = '';
  if (gaps.length) {
    gapsHTML = gaps.map(function(g) {
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
    }).join('');
  } else {
    gapsHTML = '<div style="font-size:13px;color:#666;line-height:1.6;">Your answers were consistent across all five dimensions — no single skill stands out as a gap relative to the rest of your practice.</div>';
  }

  var html =
    '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;background:#fff;">' +

    // Header
    '<div style="background:#1D1925;padding:32px;">' +
      '<div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#CE0058;margin-bottom:8px;">BU Learning</div>' +
      '<div style="font-size:24px;font-weight:700;color:#F4F3E9;line-height:1.2;">Your AI Fluency Results</div>' +
    '</div>' +

    // Intro
    '<div style="padding:32px 32px 0;">' +
      '<p style="font-size:16px;color:#1a1a2e;margin:0 0 10px;font-weight:600;">Hi ' + firstName + ',</p>' +
      '<p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Here\'s your BU AI Fluency Assessment summary. These results are yours — your individual scores stay private and are never shared with your manager or used in performance evaluations.</p>' +
    '</div>' +

    // Scores
    '<div style="padding:28px 32px 0;">' +
      '<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#999;margin-bottom:14px;">Your RANGE Profile</div>' +
      '<table style="width:100%;border-collapse:collapse;">' + scoresHTML + totalHTML + '</table>' +
      '<p style="font-size:12px;color:#999;line-height:1.6;margin:14px 0 0;">Your level is set by your weakest areas, not by your total — a strong score in one dimension doesn\'t carry the others.</p>' +
    '</div>' +

    '<div style="height:1px;background:#f0f0f0;margin:28px 32px;"></div>' +

    limitingHTML +

    // Skills
    '<div style="padding:0 32px 8px;">' +
      '<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#999;margin-bottom:14px;">Skills to Develop Next</div>' +
      gapsHTML +
    '</div>' +

    // What happens next
    '<div style="margin:20px 32px 32px;padding:20px 24px;background:#fdf2f6;border:1px solid #f5d0de;border-radius:8px;">' +
      '<div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#CE0058;margin-bottom:10px;">What happens next</div>' +
      '<p style="font-size:13px;color:#444;line-height:1.7;margin:0 0 10px;">Your answers go to the L&amp;D team, who use them to recommend the right program and curate your learning path — so you can close these skills quickly instead of hunting for resources yourself. Now that you\'ve completed the assessment, invitations for programs are coming shortly.</p>' +
      '<p style="font-size:13px;color:#555;line-height:1.7;margin:0;">If you\'d like help sooner, or there\'s a skill you want to develop that didn\'t come through in your results, email the BU Learning team at <a href="mailto:' + LD_EMAIL + '" style="color:#CE0058;text-decoration:none;">' + LD_EMAIL + '</a>. The team will take it into account when making recommendations for courses — and may even build a whole new program based on your input.</p>' +
    '</div>' +

    // Footer
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

// ── Weekly digest to L&D ───────────────────────────────────────────────────────
// The aggregate view is the primary deliverable: where the gaps concentrate,
// which is what the new programmes get designed from.

function triggerWeeklyDigest() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return;

  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var values  = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = values.slice(1).filter(function(row) {
    return new Date(row[0]) >= oneWeekAgo;
  });
  if (rows.length === 0) return;

  var col = function(name) { return headers.indexOf(name); };
  var avg = function(idx) {
    var vals = rows.map(function(r) { return Number(r[idx]); })
                   .filter(function(v) { return !isNaN(v); });
    return vals.length
      ? (vals.reduce(function(a, b) { return a + b; }, 0) / vals.length).toFixed(1)
      : 'n/a';
  };

  var scoreLines = DIM_ORDER.map(function(dim) {
    var i = col(DIM_LABELS[dim] + ' Score');
    return '  ' + DIM_LABELS[dim] + ': ' + (i > -1 ? avg(i) : 'n/a') + ' / 15';
  }).join('\n');

  // Overall level distribution
  var levelIdx = col('Overall Level');
  var levelCount = {};
  rows.forEach(function(r) {
    var l = r[levelIdx] || 'unknown';
    levelCount[l] = (levelCount[l] || 0) + 1;
  });
  var levelLines = Object.keys(levelCount).map(function(k) {
    return '  ' + k + ': ' + levelCount[k];
  }).join('\n');

  // Which dimensions are holding people back most often
  var limIdx = col('Limiting Dimensions');
  var limCount = {};
  rows.forEach(function(r) {
    String(r[limIdx] || '').split(',').forEach(function(d) {
      d = d.trim();
      if (d) limCount[d] = (limCount[d] || 0) + 1;
    });
  });
  var limLines = Object.keys(limCount)
    .sort(function(a, b) { return limCount[b] - limCount[a]; })
    .map(function(k) { return '  ' + k + ': ' + limCount[k]; }).join('\n') || '  none';

  // Most common skill gaps — this is the programme-design signal
  var gapIdx = col('Skill Gaps');
  var gapCount = {};
  rows.forEach(function(r) {
    String(r[gapIdx] || '').split('|').forEach(function(g) {
      g = g.trim();
      if (g) gapCount[g] = (gapCount[g] || 0) + 1;
    });
  });
  var gapLines = Object.keys(gapCount)
    .sort(function(a, b) { return gapCount[b] - gapCount[a]; })
    .slice(0, 12)
    .map(function(k) { return '  ' + gapCount[k] + '× ' + k; }).join('\n') || '  none';

  // Team breakdown
  var teamCount = {};
  rows.forEach(function(r) { var t = r[3]; teamCount[t] = (teamCount[t] || 0) + 1; });
  var teamLine = Object.keys(teamCount)
    .sort(function(a, b) { return teamCount[b] - teamCount[a]; })
    .map(function(k) { return k + ': ' + teamCount[k]; }).join(', ');

  var body =
    'New submissions this week: ' + rows.length + '\n\n' +
    'Average score per dimension:\n' + scoreLines + '\n\n' +
    'Overall level distribution:\n' + levelLines + '\n\n' +
    'Dimensions holding people back:\n' + limLines + '\n\n' +
    'Most common skill gaps:\n' + gapLines + '\n\n' +
    'Teams: ' + teamLine + '\n\n' +
    'Full data: ' + ss.getUrl();

  MailApp.sendEmail({
    to:      LD_EMAIL,
    subject: 'BU AI Fluency — Weekly Digest (' + rows.length + ' new submissions)',
    body:    body
  });
}
