const SHEET_NAME = 'Inscripciones';

const HEADERS = [
  'Fecha de inscripción',
  'Actividad',
  'Fecha actividad',
  'Lugar',
  'Nombre y apellidos',
  'Correo electrónico',
  'Teléfono',
  'Municipio',
  'Participa en comida',
  'Necesidades alimentarias',
  'Información próximos talleres',
  'Protección de datos',
  'Autorización imagen/voz'
];

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  ensureHeaders_(sheet);

  const p = e.parameter || {};
  const values = {
    'Fecha de inscripción': new Date(),
    'Actividad': p.actividad || '',
    'Fecha actividad': p.fecha_actividad || '',
    'Lugar': p.lugar_actividad || '',
    'Nombre y apellidos': p.nombre || '',
    'Correo electrónico': p.email || '',
    'Teléfono': p.telefono || '',
    'Municipio': p.municipio || '',
    'Participa en comida': p.participa_comida ? 'Sí' : 'No',
    'Necesidades alimentarias': p.necesidades_alimentarias || '',
    'Información próximos talleres': p.info_futuros_talleres ? 'Sí' : 'No',
    'Protección de datos': p.privacidad || '',
    'Autorización imagen/voz': p.consentimiento_imagen ? 'Sí' : 'No'
  };

  const lastColumn = sheet.getLastColumn();
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const row = currentHeaders.map(h => Object.prototype.hasOwnProperty.call(values, h) ? values[h] : '');
  sheet.appendRow(row);

  return HtmlService.createHtmlOutput('OK');
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const missing = HEADERS.filter(h => current.indexOf(h) === -1);
  if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
}
