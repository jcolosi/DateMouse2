/**
 * DateMouse - A sandbox for planning things in time
 * @author: Colosi
 * @version: 4.0
 */

/*
 * Prototypes
 */
String.prototype.reverse = function () {
  return this.split("").reduce((rev, c) => c + rev, "");
};


/*
 * Classes
 */
class UrlParams {
  /*
   * Attributes
   * data - the object the stores key:value pairs
   */

  constructor(input) {
    this.reset();
    if (input === undefined) this.build(location.search.substr(1));
    else this.build(input);
  }

  reset() {
    this.data = {};
  }

  /*
   * Parse url params and build the data object
   * input: "q=123&b=beta&x=fake_magic"
   */
  build(input) {
    let tmp = [];
    const items = input.split("&");
    //console.log("build("+input+") > ");
    //console.log(items);
    items.forEach((item) => {
      if (item.length === 0) return;
      tmp = item.split("=");
      this.data[tmp[0]] = tmp[1];
    });
    //console.log("build("+input+") < ");
    //console.log(this.data);
  }

  has(key) {
    return key in this.data;
  }

  get(key) {
    return this.data[key];
  }
}

/**
 * Constants
 */
var P_EVENTS = "p";
var P_ANCHOR = "a";
var P_PERIOD = "d";
var P_HANDLE = "h";
var P_SIMPLE = "q";
var PREFIX = window.location.href.split("?")[0];
var MILLIS_PER_DAY = 86400000;
var COLORS = [
  "#dc371d",
  "#fd8f77",
  "#8c5432",
  "#fd8b25",
  "#fdaa29",
  "#62a12d",
  "#11865b",
  "#148da5",
  "#2e87fb",
  "#0d56c9",
  "#7a8699",
  "#515f78",
  "#5247a7",
  "#ca4688",

  "#854848",
  "#A45C29",
  "#cc7000",
  "#b8b814",
  "#779A33",
  "#488548",
  "#777777",

  "#3D8F82",
  "#3D748F",
  "#3d588f",
  "#484885",
  "#664885",
  "#854885",
  "#222222"
];

/**
 * Variables
 */
var calendarId = 101;
var colorIndex = 0;
var anchor = moment();
var period = 1;
var handle = "";
var selection = new Hashset();
var colorIndexLock = false;

/**
 * Entry Point
 */
$(document).ready(function () {
  const params = getUrlParams();

  $("#calendar").fullCalendar({
    themeSystem: "bootstrap3",

    customButtons: {
      prevQuarter: {
        text: "\u21B6",
        click: function () {
          calendarPrevQuarter();
        }
      },
      prev: {
        text: "\u25C0",
        click: function () {
          calendarPrev();
        }
      },
      today: {
        text: "today",
        click: function () {
          calendarToday();
        }
      },
      next: {
        text: "\u25B6",
        click: function () {
          calendarNext();
        }
      },
      nextQuarter: {
        text: "\u21B7",
        click: function () {
          calendarNextQuarter();
        }
      },

      less: {
        text: "\u25B7\u25C1",
        click: function () {
          calendarLess();
        }
      },
      more: {
        text: "\u25C1\u25B7",
        click: function () {
          calendarMore();
        }
      },

      dummy: {},
      filter: {},
      duplicate: {
        text: "duplicate",
        click: function () {
          calendarDuplicateSelection();
        }
      },
      delete: {
        text: "delete",
        click: function () {
          calendarDeleteSelection();
        }
      },
      edit: {
        text: "edit",
        click: function () {
          calendarEditSelection();
        }
      },
      color: {},
      copyUrl: {
        text: "copy",
        click: function () {
          urlCopy();
        }
      }
    },

    header: {
      left: "prevQuarter,prev,today,next,nextQuarter less,more",
      center: "title",
      right: "dummy,filter,duplicate,delete,edit,color copyUrl"
      //right: "dummy,dummy filter duplicate,delete,edit,color copyUrl"
    },

    bootstrapGlyphicons: {
      prevQuarter: "glyphicon-backward",
      prev: "glyphicon-chevron-left",
      today: "glyphicon-time",
      next: "glyphicon-chevron-right",
      nextQuarter: "glyphicon-forward",

      less: "glyphicon-resize-small",
      more: "glyphicon-resize-full",

      dummy: "glyphicon-ban-circle",
      filter: "glyphicon-filter",
      duplicate: "glyphicon-duplicate",
      delete: "glyphicon-remove",
      edit: "glyphicon-pencil",
      color: "glyphicon-tint",
      copyUrl: "glyphicon-floppy-disk"
    },

    defaultView: "MyView",

    views: {
      MyView: {
        type: "basic",
        buttonText: "MyView"
        // titleFormat: 'YYYY [Q]Q',
      }
    },

    selectable: true,
    editable: true,
    height: "parent",
    events: getUrlEvents(params),
    firstDay: 1,
    weekends: false,

    // An event was SELECTED
    eventClick: function (event, jsEvent, view) {
      if (selection.contains(event.id)) calendarUnselectEvent(event);
      else calendarSelectEvent(event);
      calendarToggleButtons();
      // eventShow("CLICK",event);
    },

    // An event was MOVED
    eventDragStart: function (event, jsEvent, ui, view) {
      // Cannot modify events from this one.
    },

    // An event was MOVED
    eventDrop: function (event, delta, revert) {
      calendarMoveEvents(event, delta);
      // calendarSelectEvent(event);
    },

    // An event was RESIZED
    eventResize: function (event, delta, revert) {
      calendarResizeEvents(event, delta);
      // calendarSelectEvent(event);
    },

    // The calendar was CLICKED
    select: function (start, end, jsEvent, view) {
      var title = prompt("Enter new event title", "Event Title");
      if (title) {
        title = title.replace(";", "_");
        var newEvent = eventNew(title, start, end);
        if (selection.size() > 0) calendarSelectNewEvent(newEvent);
        $("#calendar").fullCalendar("renderEvent", newEvent, true); // stick = true !
        $("#calendar").fullCalendar("unselect");
        calendarUpdated();
      }
    },

    // The board is going to be RENDERED
    viewRender: function (view, element) {
      calendarMonthLabels();

      $(".fc-color-button").spectrum({
        color: COLORS[0],
        showPaletteOnly: true,
        hideAfterPaletteSelect: true,
        change: function (color, index) {
          calendarSetColor(index);
          // return false;
        },
        palette: [
          COLORS.slice(0, 7),
          COLORS.slice(7, 14),
          COLORS.slice(14, 21),
          COLORS.slice(21, 28)
        ]
      });

      $(".fc-filter-button").spectrum({
        showPaletteOnly: true,
        hideAfterPaletteSelect: false,
        isMulti: true,
        change: function (color, index, flags, count) {
          calendarSetColorLock(index, flags);
          if (count === 0) calendarFilterShowAll();
          else calendarFilter(flags);
        },
        palette: [
          COLORS.slice(0, 7),
          COLORS.slice(7, 14),
          COLORS.slice(14, 21),
          COLORS.slice(21, 28)
        ]
      });
    },

    // The board has been RENDERED
    eventAfterAllRender: function (view) {
      // var highlight = $('<div/>').addClass("high-light");
      // $( ".fc-day-grid-event" ).prepend(highlight);
    }
  });

  // Read HANDLE from url
  handle = getUrlHandle(params);
  document.title = handle;
  if (handle) {
    $(".dm-handle").val(handle);
  }

  // Read dates from url (and then update url!)
  anchor = getUrlAnchor(params, moment());
  period = getUrlPeriod(params, 1);
  calendarMove();

  $(".dm-handle").keydown(function (event) {
    if (event.which == 13) {
      this.blur();
      calendarSetHandle($(".dm-handle").val());
    }
  });

  // Disable buttons
  calendarToggleButtons();
});

// Last filter color was unchecked
function calendarFilterShowAll() {
  var events = $("#calendar").fullCalendar("clientEvents");
  events.forEach(function (entry) {
    entry.className = [];
  });
  selection.clear();
  $("#calendar").fullCalendar("updateEvents", events);
}

// Filter based on flags
function calendarFilter(flags) {
  var events = $("#calendar").fullCalendar("clientEvents");
  events.forEach(function (entry) {
    if (flags[entry.colorIndex]) entry.className = [];
    else entry.className = ["dm-filter-hide"];
  });
  selection.clear();
  $("#calendar").fullCalendar("updateEvents", events);
}

function calendarSetColorLock(index, flags) {
  if (flags[index]) colorIndexLock = index;
  else colorIndexLock = false;
}

function debugFlags(flags) {
  console.log(">");
  for (var i = 0; i < 4; i++) {
    var out = i + "     ";
    for (var j = 0; j < 7; j++) {
      var x = i * 7 + j;
      out += flags[x] ? "x" : ".";
    }
    console.log(out);
  }
}

/**
 * Keyboard Event Management
 */

$(document).keydown(function (e) {
  if (e.key == "Escape") {
    calendarClearAllEvents();
    calendarToggleButtons();
  }
  if (e.key == "a" && (event.ctrlKey || event.metaKey)) {
    calendarSelectAllEvents();
    calendarToggleButtons();
    return false;
  }
});

/**
 * Calendar Event Management
 */
function calendarSetHandle(x) {
  handle = x;
  document.title = handle;
  calendarUpdated();
}

function calendarMonthLabels() {
  $(
    '.fc-day[data-date$="01"], .fc-day.fc-mon[data-date$="02"], .fc-day.fc-mon[data-date$="03"]'
  ).each(function () {
    $(this).addClass("dm-first-of-month-cell");

    var c = $(this).attr("data-date");
    var d = moment(c, "YYYY-MM-DD");
    var v = d.format("MMM");
    var q = Number(d.format("M"));
    var a = $("<span/>");
    a.addClass("fc-title");
    a.addClass("dm-first-of-month-label");
    if (q % 2 == 0) a.addClass("dm-month-even");
    else a.addClass("dm-month-odd");
    a.append(v);
    $(this).html(a);
  });

  // Remove border-collapse
  //$('table[border-collapse$="collapse"]').each(function() {
  $(".fc table").each(function () {
    //console.log($(this));
    $(this).css("border-collapse", "separate");
  });

  // Normal cells
  $("td.fc-day").each(function () {
    var c = $(this).attr("data-date");
    var d = moment(c, "YYYY-MM-DD");
    var q = Number(d.format("M"));
    if (q % 2 == 0) $(this).addClass("dm-month-even");
    else $(this).addClass("dm-month-odd");

    // Determine if this is the last row
    const next_row_month = Number(d.add(14, "days").format("M"));
    if (next_row_month !== q) $(this).addClass("dm-last-row");
  });

  // Day numbers are sub bullets
  $("td.fc-day-top").each(function () {
    var c = $(this).attr("data-date");
    var d = moment(c, "YYYY-MM-DD");
    var q = Number(d.format("M"));
    if (q % 2 == 0) $(this).children().first().addClass("dm-month-even");
    else $(this).children().first().addClass("dm-month-odd");
  });

  // $('td.fc-day-top').each(function() {
  //    var c = $(this).attr('data-date');
  //    var d = moment(c,'YYYY-MM-DD');
  //    var q = d.format('MMM D');
  //    $(this).children().first().text(q);
  //  });

  /*
 $('td.fc-day-top').each(function() {
    var c = $(this).attr('data-date');
    var d = moment(c,'YYYY-MM-DD');
    var q = Number(d.format('M'));
    if (q%2 == 0) {
      $(this).addClass('dm-month-even');
    } else {
      $(this).addClass('dm-month-odd');
    }
  });
  */
}

function calendarPrevQuarter() {
  anchor.subtract(3, "months");
  calendarMove();
}
function calendarNextQuarter() {
  anchor.add(3, "months");
  calendarMove();
}

function calendarPrev() {
  anchor.subtract(1, "month");
  calendarMove();
}
function calendarNext() {
  anchor.add(1, "month");
  calendarMove();
}

function calendarToday() {
  anchor = moment();
  calendarMove();
}

function calendarLess() {
  if (period > 1) period--;
  calendarMove();
}
function calendarMore() {
  period++;
  calendarMove();
}

function calendarMove() {
		/*
		 * The anchor is stored as an integer. The date is interpretted as
			* beginning of day UTC. Adding 8 hours here to ensure the month gets
			* set correctly.
			*/
  var s = anchor.clone().add(8, "hours").startOf("month");
  var e = s.clone().add(period, "month");
		//console.log("     s: "+s._d);

  $("#calendar").fullCalendar("option", "visibleRange", { start: s, end: e });
  calendarUpdated();
}

function calendarUnselectEvent(event) {
  event.className = ["dm-event-unselected"];
  selection.remove(event.id);
  if (!selection.size()) calendarClearAllEvents();
  else $("#calendar").fullCalendar("updateEvent", event);
}

function calendarSelectEvent(event) {
  if (!selection.size()) calendarUnselectAllEvents();
  event.className = ["dm-event-selected"];
  selection.add(event.id);
  var c = COLORS[event.colorIndex];
  $(".fc-color-button").spectrum("set", c);
  $("#calendar").fullCalendar("updateEvent", event);
}

function calendarUnselectAllEvents() {
  // var view = $('#calendar').fullCalendar('getView');
  var events = $("#calendar").fullCalendar("clientEvents");
  events.forEach(function (event) {
    if (event.className[0] != "dm-filter-hide") {
      event.className = ["dm-event-unselected"];
    }
  });
  selection.clear();
  $("#calendar").fullCalendar("updateEvents", events);
}

function calendarSelectAllEvents() {
  var view = $("#calendar").fullCalendar("getView");
  var events = $("#calendar").fullCalendar("clientEvents");
  events.forEach(function (event) {
    if (event.end > view.intervalStart && event.start < view.intervalEnd) {
      if (event.className[0] != "dm-filter-hide") {
        event.className = ["dm-event-selected"];
        selection.add(event.id);
      }
    }
  });
  $("#calendar").fullCalendar("updateEvents", events);
}

function calendarClearAllEvents() {
  var events = $("#calendar").fullCalendar("clientEvents");
  events.forEach(function (event) {
    if (event.className[0] != "dm-filter-hide") {
      event.className = [];
    }
  });
  selection.clear();
  $("#calendar").fullCalendar("updateEvents", events);
}

function calendarSelectNewEvent(event) {
  if (!selection.size()) calendarUnselectAllEvents();
  event.className = ["dm-event-selected"];
  selection.add(event.id);
  var c = COLORS[event.colorIndex];
  $(".fc-color-button").spectrum("set", c);
  // $('#calendar').fullCalendar('renderEvent', event, true); // stick = true !
}

function calendarToggleButtons() {
  if (selection.size()) {
    $(".fc-color-button").spectrum("enable");
    $(".fc-edit-button").removeAttr("disabled");
    $(".fc-delete-button").removeAttr("disabled");
    $(".fc-duplicate-button").removeAttr("disabled");
  } else {
    $(".fc-color-button").spectrum("disable");
    $(".fc-edit-button").attr("disabled", "disabled");
    $(".fc-delete-button").attr("disabled", "disabled");
    $(".fc-duplicate-button").attr("disabled", "disabled");
  }
}

function calendarDuplicateSelection() {
  if (selection.size()) {
    var ids = selection.keys();
    ids.forEach(function (entry) {
      var fc_event = $("#calendar").fullCalendar("clientEvents", entry)[0];
      var newEvent = eventClone(fc_event);
      newEvent.className = [];
      $("#calendar").fullCalendar("renderEvent", newEvent, true); // stick = true !
    });
    calendarUpdated();
  }
}

function calendarDeleteSelection() {
  if (selection.size()) {
    var ids = selection.keys();
    ids.forEach(function (entry) {
      $("#calendar").fullCalendar("removeEvents", entry);
    });
    selection.clear();
    calendarClearAllEvents();
    calendarUpdated();
  }
}

function calendarMoveEvents(current, dur) {
  // Calculate the previous start date
  var previous = current.start.clone().subtract(dur);

  // Direction
  var fwd = dur > 0;

  // Fix the new position, this may change the start date!
  eventFix(current, fwd);

  // Update
  $("#calendar").fullCalendar("updateEvent", current);

  // Now get weekdays for he actual number moved (after fix)
  var delta = countWeekdays(previous, current.start);

  var ids = selection.keys();
  ids.forEach(function (entry) {
    if (entry != current.id) {
      var event = $("#calendar").fullCalendar("clientEvents", entry)[0];
      eventMoveWeekdays(event, delta);
      eventFix(event, fwd);
      $("#calendar").fullCalendar("updateEvent", event);
    }
  });
  calendarUpdated();
}

function calendarResizeEvents(input, dur) {
  // Calculate the previous end date
  var oldEnd = input.end.clone().subtract(dur);

  // Direction
  var fwd = dur > 0;

  // Fix the end in case it's on a weekend
  eventFixEnd(input, fwd);
  eventSetWeekdays(input);
  $("#calendar").fullCalendar("updateEvent", input);

  // Now count actual weekdays moved (after fix)
  var newEnd = input.end;
  var delta = countWeekdays(oldEnd, newEnd);

  var ids = selection.keys();
  ids.forEach(function (entry) {
    if (entry != input.id) {
      var event = $("#calendar").fullCalendar("clientEvents", entry)[0];
      event.weekdays += delta;
      if (event.weekdays < 1) event.weekdays = 1;
      eventFixLength(event);
      $("#calendar").fullCalendar("updateEvent", event);
    }
  });
  calendarUpdated();
}

function eventFix(event, fwd) {
  eventFixStart(event, fwd);
  eventFixLength(event);
}
function eventFixLength(event, fwd) {
  var current = event.start.clone();
  var days = event.weekdays;
  while (days > 0) {
    if (!isWeekendDate(current)) days--;
    current.add(1, "day");
  }
  event.end = current;
}

function eventFixStart(event, fwd) {
  var startDay = event.start.day();
  if (startDay === 0) {
    // SUNDAY
    if (fwd) event.start.add(1, "days");
    else event.start.subtract(2, "days");
  } else if (startDay === 6) {
    // SATURDAY
    if (fwd) event.start.add(2, "days");
    else event.start.subtract(1, "days");
  }
}

function eventFixEnd(event, fwd) {
  var endDay = event.end.day();
  endDay -= 1;
  if (endDay < 0) endDay = 6;
  if (endDay === 0) {
    // SUNDAY
    if (fwd) event.end.add(1, "days");
    else event.end.subtract(2, "days");
  } else if (endDay === 6) {
    // SATURDAY
    if (fwd) event.end.add(2, "days");
    else event.end.subtract(1, "days");
  }
}

function countWeekdays(a, b) {
  var reverse = false;
  if (a.diff(b, "days") > 0) {
    var tmp = a;
    a = b;
    b = tmp;
    reverse = true;
  }

  var out = 0;
  var c = b.clone();
  while (c.diff(a, "days") > 0) {
    if (!isWeekendDate(c)) out++;
    c.subtract(1, "day");
  }
  if (reverse) out *= -1;

  return out;
}

function eventMoveWeekdays(event, days) {
  if (days < 0) {
    var left = days * -1;
    while (left > 0) {
      event.start.subtract(1, "day");
      if (!isWeekendDate(event.start)) left--;
    }
  } else {
    left = days;
    while (left > 0) {
      event.start.add(1, "day");
      if (!isWeekendDate(event.start)) left--;
    }
  }
}

function isWeekendDate(m) {
  var x = m.day();
  return x === 0 || x === 6;
}

function isWeekendDay(x) {
  return x === 0 || x === 6;
}

function eventResizeWeekdays(event, days) {
  if (days < 0) {
    var left = days * -1;
    while (left > 0) {
      if (!isWeekendDate(event.start)) left--;
      event.start.subtract(1, "day");
    }
  } else {
    left = days;
    while (left > 0) {
      if (!isWeekendDate(event.start)) left--;
      event.start.add(1, "day");
    }
  }
}

// EDIT TITLE for all selected events
function calendarEditSelection() {
  var selected = selection.size();
  if (selected > 1) {
    var title = prompt("Enter new event title", "$");
    if (title) {
      title = title.replace(";", "_");
      var ids = selection.keys();
      ids.forEach(function (entry) {
        var event = $("#calendar").fullCalendar("clientEvents", entry)[0];
        var newTitle = "";
        if (title.charAt(0) === "=") {
          newTitle = regexReplace(event.title, title.substring(1));
        } else {
          newTitle = title.replace("$", event.title);
        }
        event.title = newTitle;
        $("#calendar").fullCalendar("updateEvent", event);
      });
      calendarUpdated();
    }
  } else if (selected === 1) {
    var id = selection.keys()[0];
    var event = $("#calendar").fullCalendar("clientEvents", id)[0];
    var title = prompt("Enter new event title", event.title);
    if (title) {
      title = title.replace(";", "_");
      event.title = title;
      $("#calendar").fullCalendar("updateEvent", event);
      calendarUpdated();
    }
  }
}

function regexReplace(input, regex) {
  var p = regex.split("/");
  if (p.length === 4) {
    var re = new RegExp(p[1], p[3]);
    return input.replace(re, p[2]);
  } else if (p.length === 2) {
    var re = new RegExp(p[0]);
    return input.replace(re, p[1]);
  } else return input;
}

/**
 * TODO: Hack spectrum.css and write a function to return the index of the match... DONE!
 */
// SET COLOR for all selected events
function calendarSetColor(index) {
  if (selection.size()) {
    var ids = selection.keys();
    ids.forEach(function (entry) {
      var event = $("#calendar").fullCalendar("clientEvents", entry)[0];
      event.colorIndex = index;
      event.color = COLORS[index];
      $("#calendar").fullCalendar("updateEvent", event);
    });
    calendarUpdated();
  }
}

function calendarUpdated() {
  urlUpdate();
  calendarToggleButtons();
}

/**
 * Local Event Management
 */

function eventNew(title, start, end) {
  index = nextColorIndex();
  color = COLORS[index];
  return {
    id: calendarId++,
    title: title,
    start: start,
    end: end,
    allDay: true,
    color: color,
    colorIndex: index,
    weekdays: countWeekdays(start, end)
  };
}

function eventClone(event) {
  return {
    id: calendarId++,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: true,
    color: event.color,
    colorIndex: event.colorIndex
  };
}

function eventSetWeekdays(event) {
  event.weekdays = countWeekdays(event.start, event.end);
}

function eventEncode(event) {
  var t = encodeURIComponent(event.title);
  var s = event.start / MILLIS_PER_DAY;
  var e = event.end / MILLIS_PER_DAY;
  var d = e - s;
  var c = event.colorIndex;
  return t + "," + s + "," + d + "," + c;
}

function eventShow(msg, event) {
  console.log(
    msg +
      ": " +
      event.start.format("MMM Do") +
      " -> " +
      event.end.format("MMM Do") +
      " [" +
      event.weekdays +
      "]"
  );

  // msg += ": "+event.title;
  // event.className.forEach(function(entry) {
  //   msg += "."+entry;
  // });
  // console.log(msg);
}

function eventDecode(index, code) {
  var items = code.split(",");
  var t = decodeURIComponent(items[0]);
  var s = items[1] * MILLIS_PER_DAY;
  var d = items[2] * MILLIS_PER_DAY;
  if (d < 0) d = 1 * MILLIS_PER_DAY; // REMOVE ME???
  var e = s + d;
  var c = items[3];
  var start = moment(s);
  var end = moment(e);
  return {
    id: calendarId++,
    title: t,
    start: s,
    end: e,
    allDay: true,
    color: COLORS[c],
    colorIndex: c,
    weekdays: countWeekdays(start, end)
  };
}

/**
 * Color Management
 */
function nextColorIndex() {
  if (colorIndexLock) return colorIndexLock;
  colorIndex = (colorIndex + 1) % COLORS.length;
  return "" + colorIndex;
}

// function nextColor() {
//   colorIndex = (colorIndex + 1) % COLORS.length;
//   return COLORS[colorIndex];
// }

function prevColor() {
  colorIndex--;
  if (colorIndex < 0) colorIndex = COLORS.length - 1;
  return COLORS[colorIndex];
}

/*
 * URL Management
 */
function calendarToUrl() {
  var allEvents = $("#calendar").fullCalendar("clientEvents");
  if (!allEvents.length) return PREFIX;
  var out = ""; // "q=123&b=beta&x=fake_magic"
  if (handle) out += P_HANDLE + "=" + encodeURIComponent(handle) + "&";
  out += P_ANCHOR + "=" + Math.floor(anchor / MILLIS_PER_DAY);
  out += "&" + P_PERIOD + "=" + period;
  out += "&" + P_EVENTS + "=";
  for (var i = 0; i < allEvents.length; i++) {
    if (i > 0) out += ";";
    out += eventEncode(allEvents[i]);
  }

  // Add compressed params key
  const cmp = LZString.compressToEncodedURIComponent(out).reverse();
  out = P_SIMPLE + "=" + cmp;

  return PREFIX + "?" + out;
}

function getUrlParams() {
  const params = new UrlParams();
  if (params.has(P_SIMPLE)) {
    const cmp = params.get(P_SIMPLE).reverse();
    const msg = LZString.decompressFromEncodedURIComponent(cmp);
    params.build(msg);
  }
		console.log(params);
  return params;
}
function getUrlEvents(params) {
  out = [];
  const x = params.get(P_EVENTS);
  if (x) {
    const items = x.split(";");
    for (var i = 0; i < items.length; i++) {
      out.push(eventDecode(i, items[i]));
    }
  }
  return out;
}

function getUrlAnchor(params, defaultValue) {
  const x = params.get(P_ANCHOR);
  return x ? moment(x * MILLIS_PER_DAY) : defaultValue;
}

function getUrlPeriod(params, defaultValue) {
  var x = params.get(P_PERIOD);
  return x ? x : defaultValue;
}

function getUrlHandle(params) {
  if (!params.has(P_HANDLE)) return "";
  return decodeURIComponent(params.get(P_HANDLE));
}

function urlCopy() {
  $(".fc-copyUrl-button").attr("data-clipboard-text", window.location.href);

  $("#dm-status").empty();
  var msg = $("<span/>");
  msg.addClass("dm-fading");
  msg.text("Saved URL to clipboard");
  $("#dm-status").prepend(msg);
}

function urlUpdate() {
  var url = calendarToUrl();
  history.replaceState("", "", url);
}
