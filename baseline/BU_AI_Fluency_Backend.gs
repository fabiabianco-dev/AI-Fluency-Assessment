// ── BU AI Fluency Assessment — Google Apps Script Backend ─────────────────────
// SETUP (one-time):
//   1. Open this project in Google Apps Script (script.google.com)
//   2. Click Deploy → New deployment → Web App
//      • Execute as: Me
//      • Who has access: Anyone
//   3. Copy the deployment URL
//   4. Paste it into BU_AI_Fluency_Interactive.html — replace the empty string on:
//        const GAS_URL = '';   ← paste URL here
//   5. Re-deploy whenever you edit this script (Deploy → Manage deployments → ✏ Edit)
//
// SHEET: auto-created on first submission as "Fluency Results" tab in this spreadsheet
// EMAIL: sent to learner immediately on submission; reminders sent by daily trigger
// TRIGGERS to add in Apps Script → Triggers:
//   • sendDueReminders  → Time-driven → Day timer (e.g. 8–9am)
//   • triggerWeeklyDigest → Time-driven → Week timer (Monday)

var SHEET_NAME    = 'Fluency Results';
var REMINDER_SHEET = 'Retake Reminders';
var LD_EMAIL      = 'fabia.bianco@betterup.co';

// ── Entry points ───────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.type === 'reminder') {
      logReminder(data);
    } else {
      appendToSheet(data);
      sendLearnerEmail(data);
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

function doGet() {
  return ContentService.createTextOutput('BU AI Fluency backend is live.');
}

// ── Google Sheet ───────────────────────────────────────────────────────────────

function appendToSheet(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = [
      'Timestamp', 'Name', 'Email', 'Team', 'Primary AI Tool', 'People Manager',
      'Avg Level (0–3)', 'Avg Level Label',
      'Reach', 'Autonomy', 'Navigation', 'Generalization', 'Execution Fidelity',
      'Reach Label', 'Autonomy Label', 'Navigation Label', 'Generalization Label', 'Exec Label',
      'Gap Dimensions', 'AFS Next Status',
      'Course 1 Name', 'Course 1 URL', 'Course 1 Why',
      'Course 2 Name', 'Course 2 URL', 'Course 2 Why',
      'Course 3 Name', 'Course 3 URL', 'Course 3 Why',
      'Team Collection'
    ];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1D1925')
      .setFontColor('#F4F3E9');
    sheet.setColumnWidth(1, 180);  // Timestamp
    sheet.setColumnWidth(3, 220);  // Email
  }

  var levelLabels = ['Pre-Pilot', 'Pilot', 'Builder', 'Multiplier'];
  var avgRounded  = Math.round(data.avgLevel || 0);
  var s = data.scores || {};

  var c1 = (data.courses && data.courses[0]) || {};
  var c2 = (data.courses && data.courses[1]) || {};
  var c3 = (data.courses && data.courses[2]) || {};

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name      || '',
    data.email     || '',
    data.function  || '',
    data.tool      || '',
    data.peopleManager ? 'Yes' : 'No',
    data.avgLevel  || 0,
    levelLabels[avgRounded] || '',
    s.reach          ? s.reach.level          : '',
    s.autonomy       ? s.autonomy.level        : '',
    s.navigation     ? s.navigation.level      : '',
    s.generalization ? s.generalization.level  : '',
    s.execution      ? s.execution.level       : '',
    s.reach          ? s.reach.label           : '',
    s.autonomy       ? s.autonomy.label        : '',
    s.navigation     ? s.navigation.label      : '',
    s.generalization ? s.generalization.label  : '',
    s.execution      ? s.execution.label       : '',
    (data.gapDimensions || []).join(', '),
    data.afsNextStatus || '',
    c1.name || '', c1.url || '', c1.why || '',
    c2.name || '', c2.url || '', c2.why || '',
    c3.name || '', c3.url || '', c3.why || '',
    data.collection ? data.collection.name : ''
  ]);
}

// ── Learner email ──────────────────────────────────────────────────────────────

function sendLearnerEmail(data) {
  if (!data.email) return;

  var firstName = (data.name || '').split(' ')[0] || 'there';

  var retakeDate = new Date();
  retakeDate.setDate(retakeDate.getDate() + 90);
  var retakeDateStr = Utilities.formatDate(retakeDate, Session.getScriptTimeZone(), 'MMMM d, yyyy');

  var dimOrder  = ['reach', 'autonomy', 'navigation', 'generalization', 'execution'];
  var dimLabels = { reach: 'Reach', autonomy: 'Autonomy', navigation: 'Navigation', generalization: 'Generalization', execution: 'Execution Fidelity' };
  var levelColors = { 'Pre-Pilot': '#8B8A96', 'Pilot': '#CE0058', 'Builder': '#7B5EA7', 'Multiplier': '#2E7D52' };

  // ── RANGE score rows ──
  var scoresHTML = dimOrder.map(function(dim) {
    var score = data.scores && data.scores[dim];
    var label = score ? score.label : 'Pre-Pilot';
    var color = levelColors[label] || '#8B8A96';
    return '<tr>' +
      '<td style="padding:10px 0;font-size:14px;color:#444;border-bottom:1px solid #f0f0f0;width:60%;">' + dimLabels[dim] + '</td>' +
      '<td style="padding:10px 0;text-align:right;border-bottom:1px solid #f0f0f0;">' +
        '<span style="display:inline-block;background:' + color + ';color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.04em;">' + label + '</span>' +
      '</td>' +
    '</tr>';
  }).join('');

  // ── Course cards ──
  var coursesHTML = '';
  if (data.courses && data.courses.length > 0) {
    coursesHTML = data.courses.map(function(c, i) {
      var hrs = c.hours < 1 ? Math.round(c.hours * 60) + ' min' : c.hours.toFixed(1) + ' hrs';
      return '<div style="margin-bottom:14px;padding:18px;background:#f9f9f9;border-radius:8px;border:1px solid #efefef;">' +
        '<div style="font-size:11px;color:#999;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Course ' + (i + 1) + ' of 3</div>' +
        '<div style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:4px;">' + (c.name || '') + '</div>' +
        '<div style="font-size:12px;color:#888;margin-bottom:10px;">' + (c.provider || '') + ' · ' + hrs + ' · ⭐ ' + (c.rating ? c.rating.toFixed(1) : '') + '</div>' +
        '<div style="font-size:13px;color:#555;line-height:1.6;margin-bottom:12px;font-style:italic;">' + (c.why || '') + '</div>' +
        '<a href="' + (c.url || '#') + '" style="display:inline-block;font-size:12px;font-weight:600;color:#CE0058;text-decoration:none;border:1px solid rgba(206,0,88,0.4);padding:6px 16px;border-radius:5px;letter-spacing:0.05em;">Enroll on Coursera →</a>' +
      '</div>';
    }).join('');
  }

  // ── Collection nudge ──
  var collectionHTML = '';
  if (data.collection) {
    collectionHTML =
      '<div style="margin-top:6px;padding:18px;background:#fff5f8;border-left:4px solid #CE0058;border-radius:0 8px 8px 0;">' +
        '<div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#CE0058;font-weight:600;margin-bottom:6px;">Your Team\'s Collection</div>' +
        '<div style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:6px;">' + data.collection.name + '</div>' +
        '<div style="font-size:13px;color:#555;line-height:1.6;margin-bottom:12px;">' + data.collection.desc + '</div>' +
        '<a href="' + data.collection.url + '" style="font-size:12px;font-weight:600;color:#CE0058;text-decoration:none;letter-spacing:0.05em;">Browse on Coursera →</a>' +
      '</div>';
  }

  // ── AFS Next card ──
  var afsHTML = '';
  if (data.afsNextStatus === 'recommended') {
    afsHTML =
      '<div style="margin-bottom:16px;padding:18px;background:#fff5f8;border:2px solid #CE0058;border-radius:8px;">' +
        '<div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#CE0058;font-weight:600;margin-bottom:6px;">Recommended Program</div>' +
        '<div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:6px;">AFS Next</div>' +
        '<div style="font-size:13px;color:#555;line-height:1.6;">You\'re ready — 3+ RANGE dimensions at Pilot or above. AFS Next is your highest-leverage next step. Contact L&D to enroll in an upcoming cohort.</div>' +
      '</div>';
  } else if (data.afsNextStatus === 'teaser') {
    afsHTML =
      '<div style="margin-bottom:16px;padding:16px;background:#f5f5f5;border-radius:8px;">' +
        '<div style="font-size:13px;color:#555;line-height:1.6;">You\'re building toward <strong>AFS Next</strong>. Reach Pilot in a few more RANGE dimensions to unlock it — your Coursera courses are the fastest path there.</div>' +
      '</div>';
  }

  // ── Full email HTML ──
  var html =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">' +

    // Header
    '<div style="background:#1D1925;padding:36px 32px;text-align:center;">' +
      '<div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#CE0058;margin-bottom:10px;">BetterUp · L&D</div>' +
      '<div style="font-size:24px;font-weight:700;color:#F4F3E9;line-height:1.2;">Your AI Fluency Results</div>' +
    '</div>' +

    // Intro
    '<div style="padding:32px 32px 0;">' +
      '<p style="font-size:16px;color:#1a1a2e;margin:0 0 10px;font-weight:600;">Hi ' + firstName + ',</p>' +
      '<p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 0;">Here\'s your BU AI Fluency Assessment summary. These results are yours — your individual scores stay private and are never shared with your manager or used in performance evaluations.</p>' +
    '</div>' +

    // RANGE profile
    '<div style="padding:28px 32px 0;">' +
      '<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#999;margin-bottom:14px;">Your RANGE Profile</div>' +
      '<table style="width:100%;border-collapse:collapse;">' + scoresHTML + '</table>' +
    '</div>' +

    // Divider
    '<div style="height:1px;background:#f0f0f0;margin:28px 32px;"></div>' +

    // Where to go next
    '<div style="padding:0 32px 28px;">' +
      '<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#999;margin-bottom:16px;">Where to Go Next</div>' +
      afsHTML +
      coursesHTML +
      collectionHTML +
    '</div>' +

    // 90-day reminder
    '<div style="margin:0 32px 32px;padding:20px 24px;background:#f5f5f5;border-radius:8px;text-align:center;">' +
      '<div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#999;margin-bottom:6px;">Your 90-Day Check-In</div>' +
      '<div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:4px;">' + retakeDateStr + '</div>' +
      '<div style="font-size:13px;color:#555;">Come back on this date to retake the assessment and track how your RANGE scores have shifted.</div>' +
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

// ── 90-day reminder: log + daily send ─────────────────────────────────────────

function logReminder(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(REMINDER_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(REMINDER_SHEET);
    sheet.appendRow(['Requested At', 'Name', 'Email', 'Retake Date', 'Sent']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#1D1925').setFontColor('#F4F3E9');
  }

  sheet.appendRow([
    new Date().toISOString(),
    data.name       || '',
    data.email      || '',
    data.retakeDate || '',
    'No'
  ]);
}

// Add a Time-driven → Day timer trigger pointing to this function
function sendDueReminders() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(REMINDER_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return;

  var today     = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var data      = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row        = data[i];
    var retakeDate = row[3] ? String(row[3]).slice(0, 10) : '';
    var sent       = String(row[4]).toLowerCase();

    if (retakeDate === today && sent !== 'yes') {
      var name  = row[1] || '';
      var email = row[2] || '';
      if (!email) continue;

      var firstName = name.split(' ')[0] || 'there';
      var subject   = 'Time to check your progress — BU AI Fluency Assessment';
      var html =
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
        '<div style="background:#1D1925;padding:32px;text-align:center;">' +
          '<div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#CE0058;margin-bottom:8px;">BetterUp · L&D</div>' +
          '<div style="font-size:22px;font-weight:700;color:#F4F3E9;">Your 90-Day Check-In</div>' +
        '</div>' +
        '<div style="padding:32px;">' +
          '<p style="font-size:16px;color:#1a1a2e;font-weight:600;">Hi ' + firstName + ',</p>' +
          '<p style="font-size:14px;color:#555;line-height:1.7;">90 days ago you completed the BU AI Fluency Assessment and asked us to remind you to come back. Today\'s the day.</p>' +
          '<p style="font-size:14px;color:#555;line-height:1.7;">Retake the assessment to see how your RANGE scores have shifted — most people see real movement after 90 days of deliberate AI practice.</p>' +
          '<div style="text-align:center;margin:28px 0;">' +
            '<a href="https://betterup.com" style="display:inline-block;background:#CE0058;color:#fff;font-size:13px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.05em;">Retake the Assessment →</a>' +
          '</div>' +
          '<p style="font-size:12px;color:#999;text-align:center;">Questions? Contact <a href="mailto:' + LD_EMAIL + '" style="color:#CE0058;">' + LD_EMAIL + '</a></p>' +
        '</div>' +
        '</div>';

      MailApp.sendEmail({ to: email, subject: subject, htmlBody: html });

      // Mark as sent
      sheet.getRange(i + 1, 5).setValue('Yes');
    }
  }
}

// ── Optional: weekly digest to L&D ────────────────────────────────────────────
// To activate: Apps Script → Triggers → Add trigger → triggerWeeklyDigest → Week timer

function triggerWeeklyDigest() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return;

  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1).filter(function(row) {
    return new Date(row[0]) >= oneWeekAgo;
  });

  if (rows.length === 0) return;

  // Compute avg level per dimension for new submissions
  var dimCols = { Reach: 8, Autonomy: 9, Navigation: 10, Generalization: 11, 'Execution Fidelity': 12 };
  var dimAvgs = {};
  Object.keys(dimCols).forEach(function(dim) {
    var col = dimCols[dim];
    var vals = rows.map(function(r) { return Number(r[col]); }).filter(function(v) { return !isNaN(v); });
    dimAvgs[dim] = vals.length ? (vals.reduce(function(a,b){return a+b;},0) / vals.length).toFixed(2) : 'n/a';
  });

  // Team breakdown
  var fnCount = {};
  rows.forEach(function(r) { var f = r[3]; fnCount[f] = (fnCount[f] || 0) + 1; });
  var fnBreakdown = Object.entries(fnCount).sort(function(a,b){return b[1]-a[1];})
    .map(function(e){return e[0] + ': ' + e[1];}).join(', ');

  var subject = 'BU AI Fluency — Weekly Digest (' + rows.length + ' new submissions)';
  var body = 'New submissions this week: ' + rows.length + '\n\n' +
    'Avg RANGE levels:\n' + Object.entries(dimAvgs).map(function(e){return '  ' + e[0] + ': ' + e[1];}).join('\n') + '\n\n' +
    'Teams: ' + fnBreakdown + '\n\n' +
    'Full data: ' + ss.getUrl();

  MailApp.sendEmail({ to: LD_EMAIL, subject: subject, body: body });
}
