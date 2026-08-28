const GUESTBOOK_SPREADSHEET_ID_PROPERTY = 'GUESTBOOK_SPREADSHEET_ID';
const GUESTBOOK_SHEET_NAME = 'Visitors';
const GUESTBOOK_HEADERS = ['Submitted at', 'Name', 'City'];

function doGet(event: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  const requestedPage = event.parameter.page;
  const page = requestedPage === 'sign' || requestedPage === 'view' ? requestedPage : 'home';
  if (page === 'view') getGuestbookSheet();
  const template = HtmlService.createTemplateFromFile('index');
  template.page = page;
  template.webAppUrl = ScriptApp.getService().getUrl();
  return template
    .evaluate()
    .setTitle(page === 'sign' ? 'Sign the guestbook' : page === 'view' ? 'See the guestbook' : 'nohost Web App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function submitGuestbookEntry(input: unknown): { ok: boolean; message: string } {
  const validation = validateGuestbookEntry(input);
  if (!validation.ok) return validation;

  const duplicateKey = `guestbook:${validation.value.name.toLowerCase()}:${validation.value.city.toLowerCase()}`;
  const cache = CacheService.getScriptCache();
  if (cache.get(duplicateKey)) return { ok: false, message: 'That guestbook entry was just submitted. Thank you!' };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5_000);
    getGuestbookSheet().appendRow([new Date(), validation.value.name, validation.value.city]);
    cache.put(duplicateKey, '1', 60);
    return { ok: true, message: 'Thank you for signing the guestbook!' };
  } catch (error) {
    console.error(error);
    return { ok: false, message: 'The guestbook is unavailable right now. Please try again later.' };
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function getGuestbookEntries(): { ok: boolean; entries?: GuestbookEntry[]; message?: string } {
  try {
    const sheet = getGuestbookSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { ok: true, entries: [] };
    const rows = sheet.getRange(2, 2, lastRow - 1, 2).getDisplayValues();
    const entries = rows
      .map(([name, city]) => ({ name: String(name), city: String(city) }))
      .filter((entry) => entry.name && entry.city)
      .reverse();
    return { ok: true, entries };
  } catch (error) {
    console.error(error);
    return { ok: false, message: 'The guestbook is unavailable right now.' };
  }
}

function createGuestbookSpreadsheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const properties = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5_000);
    const configuredId = properties.getProperty(GUESTBOOK_SPREADSHEET_ID_PROPERTY);
    if (configuredId) return requireGuestbookSheet(configuredId);

    const spreadsheet = SpreadsheetApp.create('nohost Visitor Guestbook');
    const sheet = spreadsheet.getActiveSheet().setName(GUESTBOOK_SHEET_NAME);
    sheet.appendRow(GUESTBOOK_HEADERS);
    properties.setProperty(GUESTBOOK_SPREADSHEET_ID_PROPERTY, spreadsheet.getId());
    return sheet;
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function getGuestbookSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(GUESTBOOK_SPREADSHEET_ID_PROPERTY);
  if (!spreadsheetId) return createGuestbookSpreadsheet();
  const sheet = requireGuestbookSheet(spreadsheetId);
  if (sheet.getLastRow() === 0) sheet.appendRow(GUESTBOOK_HEADERS);
  return sheet;
}

function requireGuestbookSheet(spreadsheetId: string): GoogleAppsScript.Spreadsheet.Sheet {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(GUESTBOOK_SHEET_NAME);
  if (!sheet) throw new Error(`Create a worksheet named ${GUESTBOOK_SHEET_NAME}.`);
  return sheet;
}
