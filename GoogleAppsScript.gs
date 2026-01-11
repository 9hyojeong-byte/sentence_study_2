
/**
 * INSTRUCTIONS:
 * 1. Open a Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the code with this snippet.
 * 4. Click 'Deploy' > 'New Deployment' > 'Web App'.
 * 5. Set 'Who has access' to 'Anyone' (IMPORTANT).
 * 6. Copy the URL and paste it into `services/apiService.ts`.
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
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      setup();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    const data = sheet.getDataRange().getDisplayValues();
    
    // 헤더만 있는 경우 빈 배열 반환
    if (data.length < 2) {
      return createJsonResponse([]);
    }
    
    const headers = data[0];
    const rows = data.slice(1);

    const jsonData = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        let val = row[i];
        if (header === 'bookmark') {
          obj[header] = (val === "true" || val === "TRUE" || val === "1");
        } else {
          obj[header] = val;
        }
      });
      return obj;
    });

    return createJsonResponse(jsonData);
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getDisplayValues();

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
      
      sheet.getRange(sheet.getLastRow(), 2).setNumberFormat("@");
      return createJsonResponse({ success: true, id: id });

    } else if (action === "delete") {
      const id = body.id;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return createJsonResponse({ success: true });

    } else if (action === "toggleBookmark") {
      const id = body.id;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
          const currentVal = (data[i][6] === true || data[i][6] === "true" || data[i][6] === "TRUE");
          sheet.getRange(i + 1, 7).setValue(!currentVal);
          break;
        }
      }
      return createJsonResponse({ success: true });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}
