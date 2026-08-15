function myFunction() {
  var hoja = SpreadsheetApp.getActive().getSheetByName('00_INICIO');
  var out;
  try {
    ejecutarSuitePaso311();
    out = 'MYFN_SUITE_311_OK';
  } catch (e) {
    out = 'MYFN_SUITE_311_ERROR: ' + e.message + ' || STACK: ' + (e.stack || 'sin stack');
  }
  hoja.getRange('A1').setValue(out);
  hoja.getRange('A2').setValue(new Date().toString());
}

