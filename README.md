# Google Calendar automatic share

This Google Script automatically makes all calendar participants (event guests) editors of the calendar.

## Setup

Follow these instructions to get this up and running with your own calendar.

### Prerequisite

Set up a Google calendar to be used:
* For a new or existing calendar, open up "Settings and Sharing"
* Under "Integrate calendar", copy out the Calendar ID, you will need this later. Example:
```
k890dw357u3nawhixe937@group.calendar.google.com
```

### Installing the script

You may install as a stand-alone script or attach it to a spreadsheet.  These instructions are for stand-alone setup.

* Go to the [Apps Script Console](https://script.google.com/).
* Click the New Script button (top left).
* Paste in the contents of editoronly.gs
* Add the Calendar ID for your calendar to calendarId on line 9. Example:

```
var calendarId = 'k890dw357u3nawhixe937@group.calendar.google.com';
```

### Enable APIs
* In the script editor, click Resources -> Advanced Google Services.
* Click the sider to turn Calendar API on.
* Click on "Google API Console" at the bottom of the menu.
* In the new Window that opens click "Enable APIS and Services".
* Search for and click on "Google Calendar API".
* Click Enable.

## Grant permissions & test
It is necessary to manually run the script once in order to grant permissions.

* From the script editor, click Run -> Run Function -> getCalendarGuests.
* A popup should open asking you to grant permissions.  Make sure to select the Google account that owns the calendar and the script if offered multiple.
* Done! You can View -> Logs to make sure your calendar guests were processed.


## Automate!
You can automate the granting of permissions by setting up the script to run at a timed interval.

* Click File -> Current Project's Triggers
* Add a new trigger
* getCalendarGuests, Time-driven, <select your own interval>


## Authors

* **Caelan Borowiec** - *Initial work* - [CaelanBorowiec](https://github.com/CaelanBorowiec/)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.


## Acknowledgments

* Uses [David Bingham](https://gist.github.com/mogsdad)'s shareCalendar function (with minor changes) from [gCalUtils.js](https://gist.github.com/mogsdad/5548177)
