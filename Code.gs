// Gets Properties object
var scriptProperties = PropertiesService.getScriptProperties();

var daysAgo = 1;
var sheetDate = subDaysFromDate(new Date(), daysAgo);
var token = null;
var monthGlobal = sheetDate.getMonth();
var monthNumbersGlobal = ['01','02','03','04','05','06','07','08','09','10','11','12'];
monthGlobal = monthNumbersGlobal[monthGlobal];
var timeRange = '%7B%27since%27:%27' + sheetDate.getFullYear() + '-' + monthGlobal + '-' + sheetDate.getDate() + '%27,%27until%27:%27' + sheetDate.getFullYear() + '-' + monthGlobal + '-' + sheetDate.getDate() + '%27%7D';

function timeRangeChecker() {
  Logger.log(timeRange);
  return timeRange;
}

function subDaysFromDate(date,d){
  // d = number of day ro substract and date = start date
  var result = new Date(date.getTime()-d*(24*3600*1000));
  return result
}

var startDate = subDaysFromDate(new Date(), daysAgo);
var endDate = subDaysFromDate(new Date(), daysAgo - 1);

function dateCheck() {
  Logger.log(startDate);
  Logger.log(endDate);
}

function nextRow() {
  var Avals = SpreadsheetApp.getActiveSheet().getRange("A1:A").getValues();
  var Alast = Avals.filter(String).length;
  // Adds one, returning the next empty row
  Alast++;
  return Alast;
}

function facebookImport() {
  var accessToken = scriptProperties.getProperty('FB_ACCESS_TOKEN');
  var date = 'yesterday';
  var activeAds = JSON.parse(UrlFetchApp.fetch('https://graph.facebook.com/v2.10/act_71151394/ads?time_range=' + timeRange + '&limit=100&effective_status=[%22ACTIVE%22,%22PAUSED%22,%22CAMPAIGN_PAUSED%22,%22ADSET_PAUSED%22,%22ARCHIVED%22]&access_token=' + accessToken));
  var writeRow = nextRow();
  var response;
  for (var i = 0; i < activeAds.data.length; i++) {
    response = JSON.parse(UrlFetchApp.fetch('https://graph.facebook.com/v2.10/' + activeAds.data[i].id + '/insights?fields=ad_name,campaign_name,spend&time_range=' + timeRange + '&access_token=' + accessToken));
    // If there is something in the response.data array (if money was spent on the ad that day)
    if (response.data.length > 0) {
      // Writes date
      SpreadsheetApp.getActiveSheet().getRange("A" + writeRow).setValue(sheetDate);
      // Writes source
      SpreadsheetApp.getActiveSheet().getRange("B" + writeRow).setValue('FACEBOOK');
      // Writes campaign
      SpreadsheetApp.getActiveSheet().getRange("C" + writeRow).setValue(response.data[0].campaign_name);
      // Writes medium
      SpreadsheetApp.getActiveSheet().getRange("D" + writeRow).setValue('SOCIAL');
      // Writes content
      SpreadsheetApp.getActiveSheet().getRange("E" + writeRow).setValue(response.data[0].ad_name);
      // Writes spend
      SpreadsheetApp.getActiveSheet().getRange("V" + writeRow).setValue(response.data[0].spend);
      // Advances to the next row to write to
      writeRow++;
    }
  }
}

  // Gets an authentication token from Echo based on an Echo user's email and password
  function echoAuth() {
    // Checks if there is already a token, if there is, the existing token is returned instead of another authentication process
    if (token === null) {
      // Sets the body data to be sent (Echo login email address and password)
      var payload = {
        'email' : scriptProperties.getProperty('ECHO_EMAIL'),
        'password' : scriptProperties.getProperty('ECHO_PASSWORD')
      };
      // Sets the request options
   var options = {
   'method' : 'post',
     'payload' : payload
 };
  // Makes the authentication request
  var response = UrlFetchApp.fetch('https://groundwire.echoglobal.org/sessions.json', options);
  // Converts the response data into JSON and saves it to the dataJSON variable
  var dataJSON = JSON.parse(response.getContentText());
      // Changes the token variable from null to the recieved token
  token = dataJSON.auth_token;
      // Returns the token back (not currently used)
  return token;
  } else {
    // Returns the token back if it already existed (not currently used)
    return token
  }
}
// Fetches a particular JSON file from Echo
function echoFetch(url) {
    // If there is no token, run the authentication function
    if (token === null) {
      echoAuth()
    }
    // Sets the part of the URL for the date range, show_average and threshold
    var dateRangeString = '?endDate=%22' + endDate.getFullYear() + '-' + (endDate.getMonth() + 1) + '-' + endDate.getDate() + 'T00:00:00.000Z%22&show_average=false&startDate=%22' + startDate.getFullYear() + '-' + (startDate.getMonth() + 1) + '-' + startDate.getDate() + 'T00:00:00.000Z%22&threshold=15';
    // Sets the final URL, combining the url paramater, dateRangeString and auth_token
    url = url + dateRangeString + "&auth_token=" + token;
    // Sets the request options
    var options = {
      'method' : 'get',
      'contentType': 'application/json'
 };
  // Makes the request
  var response = UrlFetchApp.fetch(url, options);
  // Converts the response data into JSON and saves it to the dataJSON variable
  var dataJSON = JSON.parse(response.getContentText()); 
    // Returns the retrieved, JSONed data
    return dataJSON
  }

function echoImport() {
  var utm = echoFetch('https://groundwire.echoglobal.org/report/chats/utm_campaigns.json');
  var month = sheetDate.getMonth();
  var monthNumbers = [1,2,3,4,5,6,7,8,9,10,11,12];
  month = monthNumbers[month];
  var startingRow = nextRow();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Dimension values
  
  var yearValues = ss.getRange('W1:W' + startingRow).getValues();
  yearValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var monthValues = ss.getRange('X1:X' + startingRow).getValues();
  monthValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var dayValues = ss.getRange('Y1:Y' + startingRow).getValues();
  dayValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var sourceValues = ss.getRange('B1:B' + startingRow).getValues();
  sourceValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var campaignValues = ss.getRange('C1:C' + startingRow).getValues();
  campaignValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var mediumValues = ss.getRange('D1:D' + startingRow).getValues();
  mediumValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var contentValues = ss.getRange('E1:E' + startingRow).getValues();
  contentValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up

  var found = false
  
  for (var i = 0; i < utm.data.length; i++) { // utm rows
    startingRow = nextRow();
    found = false;
    for (var j = startingRow; j > 0; j = j - 1) { // sheet rows
      if (yearValues[0,j] == sheetDate.getFullYear() && monthValues[0,j] == month && dayValues[0,j] == sheetDate.getDate() && sourceValues[0,j] == utm.data[i].source && campaignValues[0,j] == utm.data[i].campaign && mediumValues[0,j] == utm.data[i].medium && contentValues[0,j] == utm.data[i].content) { // match date and utm conditions
        Logger.log('yes' + i);
        ss.getRange('F' + j).setValue((utm.data[i]['total'] !== undefined ? utm.data[i]['total'] : 0));
        ss.getRange('G' + j).setValue((utm.data[i]['Profession of Faith'] !== undefined ? utm.data[i]['Profession of Faith'] : 0));
        ss.getRange('H' + j).setValue((utm.data[i]['Spiritual Conversation'] !== undefined ? utm.data[i]['Spiritual Conversation'] : 0));
        ss.getRange('I' + j).setValue((utm.data[i]['Gospel Presentation'] !== undefined ? utm.data[i]['Gospel Presentation'] : 0));
        ss.getRange('J' + j).setValue((utm.data[i]['Other'] !== undefined ? utm.data[i]['Other'] : 0));
        ss.getRange('K' + j).setValue((utm.data[i]['No Response'] !== undefined ? utm.data[i]['No Response'] : 0));
        found = true;
        break;
      } else {
        Logger.log('no' + i);
      }
    }
    Logger.log('end of date iteration, continuing to new row conditonal');
    // If the a corresponding sheet row wasn't found for an Echo UTM entry
    if (found == false) {
      ss.getRange('A' + startingRow).setValue(sheetDate);
      ss.getRange('B' + startingRow).setValue(utm.data[i].source);
      ss.getRange('C' + startingRow).setValue(utm.data[i].campaign);
      ss.getRange('D' + startingRow).setValue(utm.data[i].medium);
      ss.getRange('E' + startingRow).setValue(utm.data[i].content);
      ss.getRange('F' + startingRow).setValue((utm.data[i]['total'] !== undefined ? utm.data[i]['total'] : 0));
      ss.getRange('G' + startingRow).setValue((utm.data[i]['Profession of Faith'] !== undefined ? utm.data[i]['Profession of Faith'] : 0));
      ss.getRange('H' + startingRow).setValue((utm.data[i]['Spiritual Conversation'] !== undefined ? utm.data[i]['Spiritual Conversation'] : 0));
      ss.getRange('I' + startingRow).setValue((utm.data[i]['Gospel Presentation'] !== undefined ? utm.data[i]['Gospel Presentation'] : 0));
      ss.getRange('J' + startingRow).setValue((utm.data[i]['Other'] !== undefined ? utm.data[i]['Other'] : 0));
      ss.getRange('K' + startingRow).setValue((utm.data[i]['No Response'] !== undefined ? utm.data[i]['No Response'] : 0));
      ss.getRange('V' + startingRow).setValue(0);
    }
  }
}

function fillInZeroes() {
  var firstRow = firstDateRow();
  var lastRow = lastDateRow();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var totalRange = ss.getRange('F' + firstRow + ':F' + lastRow);
  var totalValues = ss.getRange('F' + firstRow + ':F' + lastRow).getValues();
  for (var j = 0; j <= (lastRow - firstRow); j++) {
    if (totalValues[0,j] == '') {
      ss.getRange('F' + (firstRow + j)).setValue(0);
      ss.getRange('G' + (firstRow + j)).setValue(0);
      ss.getRange('H' + (firstRow + j)).setValue(0);
      ss.getRange('I' + (firstRow + j)).setValue(0);
      ss.getRange('J' + (firstRow + j)).setValue(0);
      ss.getRange('K' + (firstRow + j)).setValue(0);
    }
  }
}

function importAll() {
 facebookImport();
 echoImport();
}

function firstDateRow() {  
  var lastRow = nextRow();
  var month = sheetDate.getMonth();
  var monthNumbers = [1,2,3,4,5,6,7,8,9,10,11,12];
  month = monthNumbers[month];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var yearValues = ss.getRange('W1:W' + lastRow).getValues();
  yearValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var monthValues = ss.getRange('X1:X' + lastRow).getValues();
  monthValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var dayValues = ss.getRange('Y1:Y' + lastRow).getValues();
  dayValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  for (var j = 1; j <= lastRow; j++) {
    if (yearValues[0,j] == sheetDate.getFullYear() && monthValues[0,j] == month && dayValues[0,j] == sheetDate.getDate()) {
      Logger.log(j);
      return j;
    }
  }
}

function lastDateRow() {  
  var lastRow = nextRow();
  var month = sheetDate.getMonth();
  var monthNumbers = [1,2,3,4,5,6,7,8,9,10,11,12];
  month = monthNumbers[month];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var yearValues = ss.getRange('W1:W' + lastRow).getValues();
  yearValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var monthValues = ss.getRange('X1:X' + lastRow).getValues();
  monthValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var dayValues = ss.getRange('Y1:Y' + lastRow).getValues();
  dayValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  for (var j = lastRow; j >= 0; j--) {
    if (yearValues[0,j] == sheetDate.getFullYear() && monthValues[0,j] == month && dayValues[0,j] == sheetDate.getDate()) {
      Logger.log(j);
      return j;
    }
  }
}


function csvGeneration() {  
  var firstRow = firstDateRow();
  var lastRow = lastDateRow();
  
  var csv = '';
  csv += 'ga:date,ga:medium,ga:source,ga:adCost,ga:adContent,ga:campaign\n';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dateValues = ss.getRange('Z' + firstRow + ':Z' + lastRow).getDisplayValues();
  dateValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var mediumValues = ss.getRange('D' + firstRow + ':D' + lastRow).getValues();
  mediumValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up  
  
  var sourceValues = ss.getRange('B' + firstRow + ':B' + lastRow).getValues();
  sourceValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  var costValues = ss.getRange('V' + firstRow + ':V' + lastRow).getValues();
  costValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up  
  
  var contentValues = ss.getRange('E' + firstRow + ':E' + lastRow).getValues();
  contentValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up  
  
  var campaignValues = ss.getRange('C' + firstRow + ':C' + lastRow).getValues();
  campaignValues.splice(0, 0, 'nothing') // This adds a value to the beginning of the array so that the array and the row indexes line up
  
  //Logger.log(dateValues[0,9]);
  //Logger.log(mediumValues[0,1]);
  //Logger.log(sourceValues[0,1]);
  //Logger.log(costValues[0,1]);
  //Logger.log(contentValues[0,1]);
  //Logger.log(campaignValues[0,1]);
  for (var j = 1; j <= ((lastRow - firstRow) + 1); j++) {
    if (costValues[0,j] > 0) {
      csv += dateValues[0,j] + ',' + mediumValues[0,j] + ',' + sourceValues[0,j] + ',' + costValues[0,j] + ',' + contentValues[0,j] + ',' + campaignValues[0,j];
      if (j != ((lastRow - firstRow) + 1)) {
        csv += '\n';
      }
    }
  }  
  
  return csv;
}

function saveAsCSV() {
  var fileName = 'out';
  // Check that the file name entered wasn't empty
  if (fileName.length !== 0) {
    // Add the ".csv" extension to the file name
    fileName = fileName + ".csv";
    // Convert the range data to CSV format
    var csvFile = csvGeneration();
    // Create a file in Drive with the given name, the CSV data and MimeType (file type)
    // DriveApp.createFile(fileName, csvFile, MimeType.CSV); // Saves the file to Drive
    return csvFile;
  }
  else {
    Browser.msgBox("Error: Please enter a CSV file name.");
  }
}

function uploadData() {
  csvData = saveAsCSV();
  var accountId = '58976712';
  var webPropertyId = 'UA-58976712-1';
  var customDataSourceId = 'HHsZxvJPTbu8JTozqv-25Q';
  var mediaData = Utilities.newBlob(csvData, 'application/octet-stream', 'GA import data');
  file = Analytics.Management.Uploads.uploadData(accountId, webPropertyId, customDataSourceId, mediaData)
}

function nightly() {
  importAll();
  fillInZeroes()
  uploadData();
}
