/*
* gcalendar-editor-only v1.4
* Google Script that makes all calendar event participants editors of the parent calendar
*  https://github.com/CaelanBorowiec/gcalendar-editor-only
*/

// Calendar ID can be found in the "Calendar Address" section of the Calendar Settings.
// Make sure that the account running this script has edit+share permission in each calendar.


/*
###############
##  Config   ##
###############
*/
// Set the beginning and end dates that should be evaulated.
// beginDate can be set to Date() to use today
var startDate = new Date(1970, 0, 1);  // Default to Jan 1, 1970
var endDate = new Date(2500, 0, 1);  // Default to Jan 1, 2500

// Make public?
// Danger! Setting this to true will make calendars publicly readable!
var bMakePublic = false;

// Add calendars to this array and call processCalendars() if you would like to keep everything in the script
var calendars = [
  "something@group.calendar.google.com",
  "another@group.calendar.google.com",
  "..."
];


// Otherwise if you would like to load calendars from a Google Sheet, set the following and call processCalendarsFromSheet()
var sheetID = "the id of your google spreadsheet";  // https://developers.google.com/sheets/api/guides/concepts#sheet_id
var sheetName = "Sheet1";
// Column A is for calendar ids, column B is for calendar names. https://goo.gl/W7TNXN
// Column C is for calendar 'last updated' times
// Row 1 is reserved for column labels and will not be processed.

//Email addresses of users who are supposed to be editors on all calendars
//To add them as editors to all calendars in calendars list call processGlobalEditors()
var editors = [
  "user@email",
  "user2@email",
  "..."
];

function processCalendarsFromSheet() {
  var sheet = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
  var lastRow = sheet.getLastRow();
  var array = sheet.getRange('A2:C' + lastRow).getValues();

  var filteredData = array.filter(function(n){ return n != '' });

  for(var i=0;i<(lastRow-1);i++)
  {
    var calendar = CalendarApp.getCalendarById(filteredData[i][0]);
    if (calendar == null)
      continue;

    var savedTimestanp = filteredData[i][2];
    var sModified = checkCalendarLastUpdate(filteredData[i][0]);

    //Logger.log("Checking " + sModified + " = " + savedTimestanp);
    if (sModified.toString() == filteredData[i][2])
      continue;

    var name = calendar.getName();
    sheet.getRange('B'+(i+2)).setValue(name); // Add 2 to normalize the array and to skip row 1
    Logger.log("Processing calendar:" + name);

    getCalendarGuests(filteredData[i][0]);

    sheet.getRange('C'+(i+2)).setValue(sModified); // Add 2 to normalize the array and to skip row 1
  }
}


function processCalendars() {
  for (var cals = 0; cals < calendars.length; cals++)
  {
    getCalendarGuests(calendars[cals]);
  }
}


function setCalendarPublicRead(calId)
{
  acl = {
    "scope": {
      "type": "default"
    },
    "role": "reader"
  };
  Calendar.Acl.insert(acl, calId);
}


function checkCalendarLastUpdate(calendarId)
{
  var calendar = CalendarApp.getCalendarById(calendarId);
  if (calendar != null)
  {
    var calEvents = calendar.getEvents(startDate, endDate, {orderBy: 'updated'});  //orderby not implemented  here
    var latest = 0;
    for (var i = 0; i < calEvents.length; i++)
    {
      var current = calEvents[i].getLastUpdated()
      if (current > latest)
        latest = current;
    }
    return latest;
  }
  return null;
}

function getCalendarGuests(calendarId)
{
  // Get calendar and events
  var calendar = CalendarApp.getCalendarById(calendarId);

  if (calendar != null)
  {
    var calEvents = calendar.getEvents(startDate, endDate);

    var scriptUser = Session.getEffectiveUser().getEmail();

    var arrCalendarParticipants = new Array();

    if (bMakePublic)
    {
      setCalendarPublicRead(calendarId);
    }

    // Loop through calendar events and store all
    // unique email addresses in arrCalendarParticipants
    for (var cidx = 0; cidx < calEvents.length; cidx++)
    {
      var calEvent = calEvents[cidx];
      var calEventId = calEvent.getId();

      var eventGuests = calEvent.getGuestList();
      for (var guestIDx = 0; guestIDx < eventGuests.length; guestIDx++)
      {
        var guestID = eventGuests[guestIDx];
        var guestEmail = guestID.getEmail();

        // Check for duplicates
        if (arrCalendarParticipants.indexOf(guestEmail) == -1) // if not already listed
          arrCalendarParticipants.push(guestEmail); // ...then add for processing
      }
    }

    // Use our now de-dup'd array to update permissions
    for (var i = 0; i < arrCalendarParticipants.length; i++)
    {
      var guestEmail = arrCalendarParticipants[i];
      Logger.log("Checking " + guestEmail + ":");

      if (guestEmail != scriptUser) // We can't change our own permissions, so don't try.
        shareCalendar(calendarId, guestEmail, "writer");
      else
        Logger.log("-- " + guestEmail + " is the script owner, skipping.");
    }

  }
}


/**
 * Set up calendar sharing for a single user. Refer to
 * https://developers.google.com/google-apps/calendar/v3/reference/acl/insert.
 * Uses Advanced Calendar Service, which must be enabled via Developer's Dashboard.
 * Calendar API must also be enabled in the gs project (Resources -> Advanced Google Services)
 *
 * @param {string} calId   Calendar ID
 * @param {string} user    Email address to share with
 * @param {string} role    Optional permissions, default = "reader":
 *                         "none, "freeBusyReader", "reader", "writer", "owner"
 *
 * @returns {aclResource}  See https://developers.google.com/google-apps/calendar/v3/reference/acl#resource
 */
function shareCalendar( calId, user, role ) {
  role = role || "reader";

  var acl = null;

  // Check whether there is already a rule for this user
  try {
    var acl = Calendar.Acl.get(calId, "user:"+user);
  }
  catch (e) {
    // no existing acl record for this user - as expected. Carry on.
  }
  debugger;

  if (!acl) {
    // No existing rule - insert one.
    Logger.log("-- Role does not exist for "+user+", creating...");
    acl = {
      "scope": {
        "type": "user",
        "value": user
      },
      "role": role
    };
    var newRule = Calendar.Acl.insert(acl, calId);
  }
  else {
    // There was a rule for this user - update it.
    Logger.log("-- "+user+" is already added.");
    if (acl.role != role)
    {
      Logger.log("-- "+user+"'s role was updated.");
      acl.role = role;
      newRule = Calendar.Acl.update(acl, calId, acl.id);
    }
    else
      Logger.log("-- "+user+"'s role is already correct, no changes made.");
  }

  return newRule;
}


//Goes through the calendar list and adds the users in the editors array as editors for each one
function processGlobalEditors(){
  for (var cals = 0; cals < calendars.length; cals++)
  {
    addGlobalEditors(calendars[cals]);
  }
}

//Adds all users from the editors array as editors of the specified calendar
function addGlobalEditors(calID){
  for(var editorIDX=0; editorIDX<editors.length; editorIDX++){
    shareCalendar(calID, editors[editorIDX], "writer");
  }
}
