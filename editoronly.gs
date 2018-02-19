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

  // Loop through calendar events
  for (var cidx = 0; cidx < calEvents.length; cidx++)
  {
    var calEvent = calEvents[cidx];
    var calEventId = calEvent.getId();

    var eventGuests = calEvent.getGuestList();
    for (var guestIDx = 0; guestIDx < eventGuests.length; guestIDx++)
    {
      var guestID = eventGuests[guestIDx];
      Logger.log(guestID.getEmail());
    }
  }
}
