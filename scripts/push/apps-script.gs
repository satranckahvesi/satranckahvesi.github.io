/**
 * Satranç Kahvesi bildirim abonelikleri (Google Apps Script web uygulaması).
 *
 * - Tarayıcı "subscribe" / "unsubscribe" isteği gönderir (herkese açık).
 * - GitHub Action "list" / "remove" ister (ADMIN_SECRET gerekir).
 * Abonelikler bu dosyanın bağlı olduğu E-Tablodaki "Abonelikler" sayfasında durur:
 * A endpoint, B p256dh, C auth, D kayıt zamanı.
 *
 * Kurulum için scripts/push/README.md dosyasına bakın.
 */

var SHEET_NAME = 'Abonelikler';
var MAX_SUBSCRIPTIONS = 20000;

// Bildirim adresi yalnızca bilinen tarayıcı bildirim hizmetlerine ait olabilir;
// gönderici bu adreslere istek atar. scripts/send-push.mjs içindeki liste ile aynı olmalı.
var ALLOWED_HOSTS = [
  /(^|\.)googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/,
  /(^|\.)push\.apple\.com$/
];

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad_request' });
  }

  switch (body.action) {
    case 'subscribe':
      return withLock(function () { return subscribe(body.subscription); });
    case 'unsubscribe':
      return withLock(function () { return unsubscribe(body.endpoint); });
    case 'list':
      return isAdmin(body.secret) ? reply({ ok: true, subscriptions: list() }) : reply({ ok: false, error: 'forbidden' });
    case 'remove':
      return isAdmin(body.secret)
        ? withLock(function () { return remove(body.endpoints); })
        : reply({ ok: false, error: 'forbidden' });
    default:
      return reply({ ok: false, error: 'bad_request' });
  }
}

function reply(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}

function withLock(action) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return reply({ ok: false, error: 'busy' });
  }
  try {
    return action();
  } finally {
    lock.releaseLock();
  }
}

function isAdmin(secret) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');
  return typeof secret === 'string' && expected && expected.length >= 32 && secret === expected;
}

function sheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function validEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return false;
  var match = /^https:\/\/([^\/?#:]+)(:\d+)?\//.exec(endpoint);
  return !!match && ALLOWED_HOSTS.some(function (pattern) { return pattern.test(match[1]); });
}

function validKey(value, min, max) {
  return typeof value === 'string' && value.length >= min && value.length <= max && /^[A-Za-z0-9_-]+$/.test(value);
}

function findRow(endpoint) {
  var rows = sheet().getLastRow();
  if (rows < 2) return -1;
  var endpoints = sheet().getRange(2, 1, rows - 1, 1).getValues();
  for (var i = 0; i < endpoints.length; i++) {
    if (endpoints[i][0] === endpoint) return i + 2;
  }
  return -1;
}

function subscribe(subscription) {
  var keys = subscription && subscription.keys;
  if (!subscription || !validEndpoint(subscription.endpoint) || !keys ||
      !validKey(keys.p256dh, 60, 120) || !validKey(keys.auth, 16, 40)) {
    return reply({ ok: false, error: 'invalid_subscription' });
  }

  var row = findRow(subscription.endpoint);
  var values = [[subscription.endpoint, keys.p256dh, keys.auth, new Date().toISOString()]];
  if (row > 0) {
    sheet().getRange(row, 1, 1, 4).setValues(values);
  } else {
    if (sheet().getLastRow() > MAX_SUBSCRIPTIONS) return reply({ ok: false, error: 'full' });
    sheet().appendRow(values[0]);
  }
  return reply({ ok: true });
}

function unsubscribe(endpoint) {
  if (typeof endpoint !== 'string') return reply({ ok: false, error: 'bad_request' });
  var row = findRow(endpoint);
  if (row > 0) sheet().deleteRow(row);
  return reply({ ok: true });
}

function list() {
  var rows = sheet().getLastRow();
  if (rows < 2) return [];
  return sheet().getRange(2, 1, rows - 1, 3).getValues().map(function (r) {
    return { endpoint: r[0], keys: { p256dh: r[1], auth: r[2] } };
  });
}

function remove(endpoints) {
  if (!Array.isArray(endpoints)) return reply({ ok: false, error: 'bad_request' });
  var wanted = {};
  endpoints.forEach(function (endpoint) { wanted[endpoint] = true; });
  var rows = sheet().getLastRow();
  var removed = 0;
  if (rows >= 2) {
    var values = sheet().getRange(2, 1, rows - 1, 1).getValues();
    // Bottom to top so row numbers stay valid while deleting.
    for (var i = values.length - 1; i >= 0; i--) {
      if (wanted[values[i][0]]) {
        sheet().deleteRow(i + 2);
        removed++;
      }
    }
  }
  return reply({ ok: true, removed: removed });
}
