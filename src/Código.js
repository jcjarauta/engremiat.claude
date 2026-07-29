function myFunction() {
  var hoja = SpreadsheetApp.getActive().getSheetByName('00_INICIO');
  var out;
  try {
    ejecutarSuitePaso305a310();
    out = 'MYFN_SUITE_305_310_OK';
  } catch (e) {
    out = 'MYFN_SUITE_305_310_ERROR: ' + e.message + ' || STACK: ' + (e.stack || 'sin stack');
  }
  hoja.getRange('A1').setValue(out);
  hoja.getRange('A2').setValue(new Date().toString());
}

