function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('nohost Web App — Hello World')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
