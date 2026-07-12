/**
 * Deviation Recording Portal - Google Apps Script Backend (Code.gs)
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code in Code.gs and paste this script.
 * 4. Update the `NOTIFICATION_EMAIL` variable below to your target email address.
 * 5. Save the script (Ctrl+S).
 * 6. Click "Deploy" > "New deployment".
 * 7. Select "Web app" as the type.
 * 8. Set:
 *    - Description: Deviation Web App Backend
 *    - Execute as: Me (your-email@gmail.com)
 *    - Who has access: Anyone
 * 9. Click Deploy, authorize permissions, and copy the Web App URL.
 * 10. Paste this URL into the web portal settings.
 */

// CONFIGURATION: Set the recipient email address for open deviation alerts
var NOTIFICATION_EMAIL = "anshumanmohanty.docs@gmail.com";

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "getOpenDeviations") {
      return getOpenDeviations();
    }
    if (action === "getAllDeviations") {
      return getAllDeviations();
    }
    return ContentService.createTextOutput("GCP Web App Backend is active.")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOpenDeviations() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var data = [];

  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var status = row[13]; // Status is Column 14 (Index 13)
      if (status === "UA Open" || status === "UC Open") {
        data.push({
          rowIndex: i + 2, // Spreadsheet row index (1-based, 2 is first data row)
          serialNo: row[0],
          timestamp: row[1],
          observationDate: row[2],
          shift: row[3],
          relay: row[4],
          shiftIncharge: row[5],
          classification: row[6],
          mainHazard: row[7],
          briefDescription: row[8],
          deviationPhotos: row[9],
          responsiblePerson: row[10],
          actionTaken: row[11],
          rectificationPhotos: row[12],
          status: status,
          submittedBy: row[14],
          submittedByEmail: row[15]
        });
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function getAllDeviations() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var data = [];

  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      data.push({
        rowIndex: i + 2, // Spreadsheet row index (1-based, 2 is first data row)
        serialNo: row[0],
        timestamp: row[1],
        observationDate: row[2],
        shift: row[3],
        relay: row[4],
        shiftIncharge: row[5],
        classification: row[6],
        mainHazard: row[7],
        briefDescription: row[8],
        deviationPhotos: row[9],
        responsiblePerson: row[10],
        actionTaken: row[11],
        rectificationPhotos: row[12],
        status: row[13],
        submittedBy: row[14],
        submittedByEmail: row[15]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // 1. Parse incoming JSON data
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No payload contents found in request.");
    }

    var data = JSON.parse(e.postData.contents);

    // Route Close Deviation Action
    if (data.action === "closeDeviation") {
      return closeDeviation(data);
    }

    // 2. Open active sheet and check/create headers if empty
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow === 0) {
      // Write headers if sheet is brand new
      sheet.appendRow([
        "S No.",
        "Timestamp",
        "Date of Observation",
        "Shift",
        "Relay",
        "Shift Incharge / Person Observed",
        "Classification (UA/UC)",
        "Main Hazard",
        "Brief Description",
        "Photos of Deviation (Drive Links)",
        "Responsible Person",
        "Action Taken",
        "Photos after Rectification (Drive Links)",
        "Status",
        "Submitted By",
        "Submitted By Email"
      ]);
      // Format headers: Bold, background color, and borders
      sheet.getRange(1, 1, 1, 16)
        .setFontWeight("bold")
        .setBackground("#f1f5f9")
        .setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
      lastRow = 1; // update rows reference
    }

    // 3. Auto-calculate S No. (next row index)
    var serialNo = lastRow; // Since row 1 is header, row 2 will be S No. 1

    // 4. Process files: Upload to Google Drive and return sharing URLs
    var deviationPhotoUrls = uploadPhotosToDrive("Deviation Photos", data.deviationPhotos);
    var rectificationPhotoUrls = uploadPhotosToDrive("Rectification Photos", data.rectificationPhotos);

    // 5. Append row values
    var timestamp = new Date();
    var rowValues = [
      serialNo,
      timestamp,
      data.observationDate,
      data.shift,
      data.relay,
      data.shiftIncharge,
      data.classification,
      data.mainHazard,
      data.briefDescription,
      deviationPhotoUrls.length > 0 ? deviationPhotoUrls.join("\n") : "No photos",
      data.responsiblePerson,
      data.actionTaken,
      rectificationPhotoUrls.length > 0 ? rectificationPhotoUrls.join("\n") : "No photos",
      data.status,
      data.submittedBy,
      data.submittedByEmail
    ];

    sheet.appendRow(rowValues);

    // Auto-fit column widths
    var cols = sheet.getLastColumn();
    for (var col = 1; col <= cols; col++) {
      sheet.autoResizeColumn(col);
    }

    // 6. Check if Status is "Open" (UA Open / UC Open) -> Send email notification
    if (data.status === "UA Open" || data.status === "UC Open") {
      sendEmailAlert(serialNo, data, deviationPhotoUrls);
    }

    // Return successful response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Deviation recorded successfully.",
      serialNumber: serialNo,
      row: sheet.getLastRow()
    }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(error.toString());

    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Decodes base64 data and uploads it to a specific Google Drive folder.
 * Returns an array of public viewable links.
 */
function uploadPhotosToDrive(folderName, photosList) {
  var urls = [];
  if (!photosList || photosList.length === 0) return urls;

  var folder;
  var folders = DriveApp.getFoldersByName(folderName);

  while (folders.hasNext()) {
    var f = folders.next();
    if (!f.isTrashed()) {
      folder = f;
      break;
    }
  }

  if (!folder) {
    folder = DriveApp.createFolder(folderName);
  }

  for (var i = 0; i < photosList.length; i++) {
    var photo = photosList[i];

    // Decode base64 content
    var rawData = Utilities.base64Decode(photo.base64);
    var blob = Utilities.newBlob(rawData, photo.type, photo.name);

    // Write file to Drive folder
    var file = folder.createFile(blob);

    // Authorize public link permissions safely
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log("Public sharing permissions warning: " + e.toString());
    }

    urls.push(file.getUrl());
  }
  return urls;
}

/**
 * Sends a structured, beautifully formatted safety notification email.
 */
function sendEmailAlert(serialNo, data, deviationPhotoUrls) {
  if (!NOTIFICATION_EMAIL || NOTIFICATION_EMAIL.trim() === "" || NOTIFICATION_EMAIL.indexOf("@") === -1) {
    Logger.log("Email notification skipped: No valid destination address configured.");
    return;
  }

  var subject = "[SAFETY ALERT] Open Deviation Logged - S No. " + serialNo + " (" + data.classification + ")";

  // Format photos list into HTML links
  var photoHtml = "No photos uploaded.";
  if (deviationPhotoUrls && deviationPhotoUrls.length > 0) {
    photoHtml = "<ul>";
    for (var i = 0; i < deviationPhotoUrls.length; i++) {
      photoHtml += '<li><a href="' + deviationPhotoUrls[i] + '" target="_blank" style="color: #2563eb; text-decoration: underline;">Deviation Photo ' + (i + 1) + '</a></li>';
    }
    photoHtml += "</ul>";
  }

  // Construct styled HTML Body
  var htmlBody =
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">' +
    // Header
    '<div style="background-color: #ef4444; color: #ffffff; padding: 20px; text-align: center;">' +
    '<h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">MINING OPERATIONS SAFETY ALERT</h2>' +
    '<p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">An unresolved deviation (Status: ' + data.status + ') has been recorded.</p>' +
    '</div>' +

    // Body Content
    '<div style="padding: 24px; background-color: #ffffff; color: #334155; line-height: 1.6;">' +
    '<p style="margin-top: 0; font-size: 15px;">Hello Safety Team,</p>' +
    '<p style="font-size: 14px;">Please find the details of the open safety deviation reported on the portal below:</p>' +

    // Metadata Table
    '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">' +
    '<tbody>' +
    '<tr style="background-color: #f8fafc;">' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 40%;">Serial Number:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + serialNo + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Date of Observation:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + data.observationDate + '</td>' +
    '</tr>' +
    '<tr style="background-color: #f8fafc;">' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Shift & Relay:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + data.shift + ' &middot; ' + data.relay + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Shift Incharge:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + data.shiftIncharge + '</td>' +
    '</tr>' +
    '<tr style="background-color: #f8fafc;">' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Classification:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ef4444;">' + data.classification + ' (' + data.status + ')</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Main Hazard Category:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + data.mainHazard + '</td>' +
    '</tr>' +
    '<tr style="background-color: #f8fafc;">' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Responsible Person/Dept:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">' + data.responsiblePerson + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Submitted By:</td>' +
    '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + data.submittedBy + ' (' + data.submittedByEmail + ')</td>' +
    '</tr>' +
    '</tbody>' +
    '</table>' +

    // Brief Description section
    '<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin-bottom: 20px;">' +
    '<h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #991b1b;">Brief Description of Deviation:</h4>' +
    '<p style="margin: 0; font-size: 13px; color: #7f1d1d;">' + data.briefDescription + '</p>' +
    '</div>' +

    // Action Taken section
    '<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin-bottom: 20px;">' +
    '<h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #166534;">Action Taken:</h4>' +
    '<p style="margin: 0; font-size: 13px; color: #14532d;">' + data.actionTaken + '</p>' +
    '</div>' +

    // Photos Links Section
    '<div style="margin-top: 15px;">' +
    '<h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Uploaded Deviation Photos:</h4>' +
    photoHtml +
    '</div>' +

    '<p style="margin-top: 25px; font-size: 13px; color: #64748b;">Please coordinate with the responsible person/department to ensure rectification is completed and verified.</p>' +
    '</div>' +

    // Footer
    '<div style="background-color: #f8fafc; padding: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">' +
    'This is an automated safety alert generated from the Mining Deviation Recording Portal.<br/>' +
    '&copy; 2026 Mining Safety Division. All rights reserved.' +
    '</div>' +
    '</div>';

  try {
    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log("Notification email successfully sent to " + NOTIFICATION_EMAIL);
  } catch (err) {
    Logger.log("Failed to send email alert: " + err.toString());
  }
}

/**
 * Updates an open deviation row in the spreadsheet to mark it closed.
 */
function closeDeviation(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rowIndex = parseInt(data.rowIndex, 10);

  if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error("Invalid row index provided: " + rowIndex);
  }

  // Verify the Serial Number matches to prevent mismatch
  var sheetSerialNo = sheet.getRange(rowIndex, 1).getValue();
  if (sheetSerialNo.toString() !== data.serialNo.toString()) {
    throw new Error("Row index mismatch. Expected Serial No: " + data.serialNo + ", found: " + sheetSerialNo);
  }

  // Dynamically add columns 17-20 if sheet doesn't have them
  var lastCol = sheet.getLastColumn();
  if (lastCol < 20) {
    sheet.getRange(1, 17, 1, 4).setValues([[
      "Closed By",
      "Date of Closing",
      "Closing Relay",
      "Closing Shift"
    ]]);
    sheet.getRange(1, 17, 1, 4)
      .setFontWeight("bold")
      .setBackground("#f1f5f9")
      .setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }

  // Update status, action taken, and metadata first (always succeeds)
  var classification = sheet.getRange(rowIndex, 7).getValue(); // Column 7
  var newStatus = classification === "UA" ? "UA Close" : "UC Close";

  sheet.getRange(rowIndex, 12).setValue(data.actionTaken); // Column 12 (Action Taken)
  sheet.getRange(rowIndex, 14).setValue(newStatus); // Column 14 (Status)
  sheet.getRange(rowIndex, 17).setValue(data.closedBy); // Column 17 (Closed By)
  sheet.getRange(rowIndex, 18).setValue(data.dateOfClosing); // Column 18 (Date of Closing)
  sheet.getRange(rowIndex, 19).setValue(data.closingRelay); // Column 19 (Closing Relay)
  sheet.getRange(rowIndex, 20).setValue(data.closingShift); // Column 20 (Closing Shift)

  // Upload rectification photos safely in a try-catch to protect status update
  var photosCellContent = "No photos uploaded.";
  if (data.rectificationPhotos && data.rectificationPhotos.length > 0) {
    try {
      var rectificationPhotoUrls = uploadPhotosToDrive("Rectification Photos", data.rectificationPhotos);
      if (rectificationPhotoUrls && rectificationPhotoUrls.length > 0) {
        photosCellContent = rectificationPhotoUrls.join("\n");
      }
    } catch (e) {
      photosCellContent = "Photo upload failed: " + e.toString();
      Logger.log("Rectification photo upload failed: " + e.toString());
    }
  }

  sheet.getRange(rowIndex, 13).setValue(photosCellContent); // Column 13 (Rectification Photos)

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Deviation #" + data.serialNo + " closed successfully."
  })).setMimeType(ContentService.MimeType.JSON);
}
