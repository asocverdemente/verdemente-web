function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Inscripciones');
  if (!sheet) sheet = ss.insertSheet('Inscripciones');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Fecha y hora', 'Actividad', 'Fecha actividad', 'Lugar',
      'Nombre y apellidos', 'Correo electrónico', 'Teléfono',
      'Municipio', 'Información próximos talleres', 'Privacidad'
    ]);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),
    e.parameter.actividad || '',
    e.parameter.fecha_actividad || '',
    e.parameter.lugar_actividad || '',
    e.parameter.nombre || '',
    e.parameter.email || '',
    e.parameter.telefono || '',
    e.parameter.municipio || '',
    e.parameter.info_futuros_talleres || 'No',
    e.parameter.privacidad || ''
  ]);

  return HtmlService.createHtmlOutput('OK');
}
