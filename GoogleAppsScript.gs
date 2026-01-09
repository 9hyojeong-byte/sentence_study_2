
/**
 * INSTRUCTIONS:
 * 1. Open a Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the code with this snippet.
 * 4. Click 'Deploy' > 'New Deployment' > 'Web App'.
 * 5. Set 'Who has access' to 'Anyone'.
 * 6. Copy the URL and paste it into `services/apiService.ts` in your React app.
 */

const SHEET_NAME = "Sentences";

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "date", "sentence", "meaning", "hint", "referenceUrl", "bookmark", "createdAt"]);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const jsonData = rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    // Ensure types
    obj.bookmark = (obj.bookmark === true || obj.bookmark === "true" || obj.bookmark === "TRUE");
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (action === "upsert") {
    const item = body.data;
    let rowIndex = -1;

    if (item.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == item.id) {
          rowIndex = i + 1;
          break;
        }
      }
    }

    const id = item.id || Utilities.getUuid();
    const rowData = [
      id,
      item.date || new Date().toISOString().split('T')[0],
      item.sentence || "",
      item.meaning || "",
      item.hint || "",
      item.referenceUrl || "",
      item.bookmark || false,
      item.createdAt || new Date().toISOString()
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, id: id }))
      .setMimeType(ContentService.MimeType.JSON);

  } else if (action === "delete") {
    const id = body.id;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } else if (action === "toggleBookmark") {
    const id = body.id;
    let currentVal = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        currentVal = (data[i][6] === true || data[i][6] === "true" || data[i][6] === "TRUE");
        sheet.getRange(i + 1, 7).setValue(!currentVal);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, bookmark: !currentVal }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}
