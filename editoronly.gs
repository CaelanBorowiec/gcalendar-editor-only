/*
* gcalendar-editor-only v1.1.2
* Google Script that makes all calendar event participants editors of the parent calendar
*  https://github.com/CaelanBorowiec/gcalendar-editor-only
*/


// Calendar ID can be found in the "Calendar Address" section of the Calendar Settings.
var calendarId = '';

// Set the beginning and end dates that should be evaulated.
// beginDate can be set to Date() to use today
var startDate = new Date(1970, 0, 1);  // Default to Jan 1, 1970
var endDate = new Date(2500, 0, 1);  // Default to Jan 1, 2500

function getCalendarGuests() {
  // Get calendar and events
  var calendar = CalendarApp.getCalendarById(calendarId);
  var calEvents = calendar.getEvents(startDate, endDate);

  var scriptUser = Session.getEffectiveUser().getEmail();

  // Loop through calendar events
  for (var cidx = 0; cidx < calEvents.length; cidx++)
  {
    var calEvent = calEvents[cidx];
    var calEventId = calEvent.getId();

    var eventGuests = calEvent.getGuestList();
    for (var guestIDx = 0; guestIDx < eventGuests.length; guestIDx++)
    {
      var guestID = eventGuests[guestIDx];
      var guestEmail = guestID.getEmail();

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
      newRule = Calendar.Acl.update(acl, calId, acl.id)
    }
    else
      Logger.log("-- "+user+"'s role is already correct, no changes made.");
  }

  return newRule;
}
