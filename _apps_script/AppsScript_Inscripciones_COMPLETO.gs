/**
 * SABERES DEL TERRITORIO · Inscripciones 2026
 * Apps Script vinculado a la hoja "Inscripciones Saberes del Territorio 2026".
 *
 * Funciones:
 * - recibe formularios web (POST)
 * - detecta duplicados
 * - controla cupo / lista de espera
 * - envía correo automático de confirmación
 * - expone por JSONP las plazas disponibles para la web (GET action=status)
 */
const SHEET_NAME = 'Inscripciones';
const DEFAULT_CAPACITY = 30;

const ACTIVITIES = {
  alfareria: {
    name: 'Alfarería', date: '17 de octubre de 2026', place: 'Arroyo de la Luz', capacity: 30
  },
  piedra_seca: {
    name: 'Construcción en piedra seca', date: '24 de octubre de 2026', place: 'Arroyomolinos de Montánchez', capacity: 20
  },
  memoria_alimentaria: {
    name: 'Memoria alimentaria y cocina tradicional', date: '7 de noviembre de 2026', place: 'Montánchez', capacity: 30, meeting: '9:30 · inicio de la Ruta del Castañar de Montánchez'
  },
  arquitectura_tierra: {
    name: 'Arquitectura tradicional: cómo construir con materiales del territorio', date: '21 de noviembre de 2026', place: 'Alcuéscar', capacity: 30
  },
  queso: {
    name: 'Elaboración artesanal de queso', date: '19 de diciembre de 2026', place: 'Casar de Cáceres', capacity: 30
  },
  campanas: {
    name: 'Toque manual de campanas', date: '27 de septiembre de 2026', place: 'Sierra de Fuentes', capacity: 30
  },
  jornadas_arte_patrimonio: {
    name: 'Jornadas de Arte y Patrimonio en la Dehesa', date: '27 de septiembre de 2026', place: 'Sierra de Fuentes y Torrequemada', capacity: 80
  }
};

const REQUIRED_HEADERS = [
  'Fecha de inscripción','Actividad','Fecha actividad','Lugar','Nombre y apellidos','Correo electrónico','Teléfono','Municipio',
  'Participa en comida','Necesidades alimentarias','Información próximos talleres','Protección de datos','Marca temporal','Actividad ID',
  'Lugar actividad','Participa comida','Información futuros talleres','Privacidad','Consentimiento imagen','Consentimiento WhatsApp',
  'Estado','Número de orden','Posición lista de espera','Correo automático'
];

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'status') return jsonp_({ok:false,error:'Acción no reconocida'}, p.callback);
  const id = String(p.actividad_id || '').trim();
  const meta = ACTIVITIES[id];
  if (!meta) return jsonp_({ok:false,error:'Actividad no reconocida'}, p.callback);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const confirmed = sheet ? countConfirmed_(sheet, id, meta.name) : 0;
  const capacity = Number(meta.capacity || DEFAULT_CAPACITY);
  const remaining = Math.max(0, capacity - confirmed);
  return jsonp_({ok:true,activityId:id,capacity:capacity,confirmed:confirmed,remaining:remaining,full:remaining<=0}, p.callback);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const requestToken = String(p.request_token || '');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    ensureHeaders_(sheet);

    const id = String(p.actividad_id || '').trim();
    const meta = ACTIVITIES[id] || {
      name: String(p.actividad || '').trim(),
      date: String(p.fecha_actividad || '').trim(),
      place: String(p.lugar_actividad || '').trim(),
      capacity: DEFAULT_CAPACITY
    };
    const name = String(p.nombre || '').trim();
    const email = String(p.email || '').trim().toLowerCase();
    if (!name || !email || !meta.name) throw new Error('Faltan datos obligatorios.');

    const duplicate = findDuplicate_(sheet, id, meta.name, email);
    const confirmedBefore = countConfirmed_(sheet, id, meta.name);
    const capacity = Number(meta.capacity || DEFAULT_CAPACITY);
    const waitlist = !duplicate && confirmedBefore >= capacity;
    const orderNumber = !duplicate && !waitlist ? confirmedBefore + 1 : '';
    const waitPos = waitlist ? countWaitlist_(sheet, id, meta.name) + 1 : '';
    const state = duplicate ? 'Duplicada' : (waitlist ? 'Lista de espera' : 'Confirmada');

    const now = new Date();
    const values = {
      'Fecha de inscripción': now,
      'Actividad': meta.name || p.actividad || '',
      'Fecha actividad': p.fecha_actividad || meta.date || '',
      'Lugar': p.lugar_actividad || meta.place || '',
      'Nombre y apellidos': name,
      'Correo electrónico': email,
      'Teléfono': p.telefono || '',
      'Municipio': p.municipio || '',
      'Participa en comida': truthy_(p.participa_comida) ? 'Sí' : 'No',
      'Necesidades alimentarias': p.necesidades_alimentarias || '',
      'Información próximos talleres': truthy_(p.info_futuros_talleres) ? 'Sí' : 'No',
      'Protección de datos': p.privacidad || '',
      'Marca temporal': now,
      'Actividad ID': id,
      'Lugar actividad': p.lugar_actividad || meta.place || '',
      'Participa comida': truthy_(p.participa_comida) ? 'Sí' : 'No',
      'Información futuros talleres': truthy_(p.info_futuros_talleres) ? 'Sí' : 'No',
      'Privacidad': p.privacidad || '',
      'Consentimiento imagen': truthy_(p.consentimiento_imagen) ? 'Sí' : 'No',
      'Consentimiento WhatsApp': truthy_(p.consentimiento_whatsapp) ? 'Sí' : 'No',
      'Estado': state,
      'Número de orden': orderNumber,
      'Posición lista de espera': waitPos,
      'Correo automático': ''
    };

    const rowNumber = appendMappedRow_(sheet, values);
    let emailSent = false;
    try {
      sendRegistrationEmail_(email, name, meta, waitlist, duplicate, waitPos, truthy_(p.consentimiento_whatsapp));
      emailSent = true;
    } catch (mailErr) {
      console.error(mailErr);
    }
    setCellByHeader_(sheet, rowNumber, 'Correo automático', emailSent ? 'Sí' : 'No');

    return postMessageResponse_({type:'VERDEMENTE_FORM_RESULT',ok:true,requestToken:requestToken,duplicate:duplicate,waitlist:waitlist,emailSent:emailSent});
  } catch (err) {
    console.error(err);
    return postMessageResponse_({type:'VERDEMENTE_FORM_RESULT',ok:false,requestToken:requestToken,error:String(err && err.message || err)});
  }
}

function sendRegistrationEmail_(to, personName, meta, waitlist, duplicate, waitPos, whatsappConsent) {
  const workshopsUrl = 'https://asocverdemente.github.io/verdemente-web/saberes-del-territorio.html';
  const associationUrl = 'https://asocverdemente.github.io/verdemente-web/verdemente.html';
  const activity = escapeHtml_(meta.name || 'la actividad');
  const date = escapeHtml_(meta.date || '');
  const place = escapeHtml_(meta.place || '');
  const person = escapeHtml_(personName || '');

  let subject, statusText, statusHtml;
  if (waitlist) {
    subject = 'Lista de espera · ' + (meta.name || 'Saberes del Territorio');
    statusText = 'El taller está completo y te hemos incorporado a la lista de espera' + (waitPos ? ' (posición ' + waitPos + ')' : '') + '.';
    statusHtml = '<strong>El taller está completo y te hemos incorporado a la lista de espera' + (waitPos ? ' (posición ' + waitPos + ')' : '') + '.</strong>';
  } else {
    subject = 'Inscripción recibida · ' + (meta.name || 'Saberes del Territorio') + ' · Saberes del Territorio';
    statusText = duplicate ? 'Tu inscripción ya constaba registrada. Tu plaza sigue confirmada.' : 'Tu plaza está confirmada.';
    statusHtml = '<strong>' + escapeHtml_(statusText) + '</strong>';
  }

  const whatsappText = whatsappConsent
    ? 'Has indicado que autorizas la inclusión de tu teléfono en un posible grupo temporal de WhatsApp de participantes, pensado para facilitar cuestiones prácticas como compartir coche y, después del encuentro, fotografías del evento.'
    : 'Si se crea un grupo temporal de WhatsApp para cuestiones prácticas como compartir coche o fotografías del evento, solo incluiremos a quienes lo hayan autorizado expresamente.';

  const plain = [
    'Hola ' + personName + ',', '',
    'Hemos recibido tu inscripción en ' + (meta.name || 'la actividad') + '.', '',
    statusText, '',
    'Fecha: ' + (meta.date || ''),
    'Lugar: ' + (meta.place || ''), meta.meeting ? 'Punto de encuentro: ' + meta.meeting : '', '',
    'Unos días antes del curso recibirás por correo las instrucciones detalladas sobre el lugar y la hora exacta de encuentro, junto con información práctica para la jornada y las alternativas previstas para la comida.', '',
    whatsappText, '',
    '¿Te interesan otros talleres? Consulta el programa de Saberes del Territorio: ' + workshopsUrl, '',
    'Gracias por participar en Saberes del Territorio, un proyecto implementado por la Asociación VerdeMente (' + associationUrl + ') y subvencionado por la Junta de Extremadura.', '',
    'Un saludo,', 'Asociación VerdeMente', 'asocverdemente@gmail.com'
  ].join('\n');

  const htmlBody = '<p>Hola ' + person + ',</p>' +
    '<p>Hemos recibido tu inscripción en <strong>' + activity + '</strong>.</p>' +
    '<p>' + statusHtml + '</p>' +
    '<p>📅 <strong>Fecha:</strong> ' + date + '<br>📍 <strong>Lugar:</strong> ' + place + (meta.meeting ? '<br>🕤 <strong>Punto de encuentro:</strong> ' + escapeHtml_(meta.meeting) : '') + '</p>' +
    '<p>Unos días antes del curso recibirás por correo las <strong>instrucciones detalladas sobre el lugar y la hora exacta de encuentro</strong>, junto con información práctica para la jornada y las <strong>alternativas previstas para la comida</strong>.</p>' +
    '<p>' + escapeHtml_(whatsappText) + '</p>' +
    '<p>👉 <strong>¿Te interesan otros talleres?</strong><br><a href="' + workshopsUrl + '">Consulta el programa de Saberes del Territorio y las próximas actividades</a>.</p>' +
    '<p>Gracias por participar en <strong>Saberes del Territorio</strong>, un proyecto implementado por la <a href="' + associationUrl + '"><strong>Asociación VerdeMente</strong></a> y subvencionado por la <strong>Junta de Extremadura</strong>.</p>' +
    '<p>Un saludo,<br><strong>Asociación VerdeMente</strong><br><a href="mailto:asocverdemente@gmail.com">asocverdemente@gmail.com</a></p>';

  MailApp.sendEmail({to:to,subject:subject,body:plain,htmlBody:htmlBody,name:'Asociación VerdeMente'});
}

function countConfirmed_(sheet, id, activityName) {
  return readRows_(sheet).filter(function(r){
    if (!sameActivity_(r, id, activityName)) return false;
    const state = norm_(r['Estado']);
    return state === 'confirmada' || state === '';
  }).length;
}

function countWaitlist_(sheet, id, activityName) {
  return readRows_(sheet).filter(function(r){
    return sameActivity_(r, id, activityName) && norm_(r['Estado']) === 'lista de espera';
  }).length;
}

function findDuplicate_(sheet, id, activityName, email) {
  const target = norm_(email);
  return readRows_(sheet).some(function(r){
    if (!sameActivity_(r, id, activityName)) return false;
    if (norm_(r['Correo electrónico']) !== target) return false;
    const state = norm_(r['Estado']);
    return state !== 'duplicada' && state !== 'prueba' && state !== 'cancelada';
  });
}

function sameActivity_(row, id, activityName) {
  const rowId = norm_(row['Actividad ID']);
  if (id && rowId && rowId === norm_(id)) return true;
  return norm_(row['Actividad']) === norm_(activityName);
}

function readRows_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();
  return values.map(function(row){
    const obj={}; headers.forEach(function(h,i){obj[String(h)]=row[i];}); return obj;
  });
}

function appendMappedRow_(sheet, values) {
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function(h){return Object.prototype.hasOwnProperty.call(values,h) ? values[h] : '';});
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function setCellByHeader_(sheet, rowNumber, header, value) {
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const idx = headers.indexOf(header);
  if (idx >= 0) sheet.getRange(rowNumber, idx+1).setValue(value);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1,1,1,REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }
  const current = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  const missing = REQUIRED_HEADERS.filter(function(h){return current.indexOf(h) === -1;});
  if (missing.length) sheet.getRange(1,current.length+1,1,missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
}

function postMessageResponse_(payload) {
  const safe = JSON.stringify(payload).replace(/</g,'\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>try{window.parent.postMessage(' + safe + ',"*");}catch(e){}</scr' + 'ipt>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function jsonp_(payload, callback) {
  const cb = String(callback || 'callback');
  const safeCb = /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(cb) ? cb : 'callback';
  const out = safeCb + '(' + JSON.stringify(payload).replace(/</g,'\\u003c') + ');';
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function truthy_(v) {
  const s = norm_(v);
  return s === 'si' || s === 'sí' || s === 'true' || s === '1' || s === 'on';
}

function norm_(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

function escapeHtml_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
}
