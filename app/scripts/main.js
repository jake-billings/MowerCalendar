//The Google API must be loaded from its CDN.  Declare the google global if it is not defined.
if (typeof google == 'undefined') {
  google = null;
}

//Isolate from global scope; good practice but not necessary with an Angular module
(function ($, angular, google, Firebase, eakjbMowingCalendar) {

  //Declare the angular module and its angular dependencies
  angular.module("eakjbMowingCalendar", ["ngRoute", "firebase"])

    //Configure the ngRoute paths
    .config(function ($routeProvider) {
      $routeProvider
        .when("/home", {
          controller: "EakjbStaticController",
          templateUrl: "templates/home.html"
        })
        .when("/calendar", {
          controller: "EakjbCalendarController",
          templateUrl: "templates/calendar.html"
        }).when("/admin", {
          controller: "EakjbAdminController",
          templateUrl: "templates/admin.html"
        }).when("/about", {
          controller: "EakjbAboutController",
          templateUrl: "templates/about.html"
        }).otherwise({
          redirectTo: "/home"
        })
    })

    //Load mowing events from Firebase
    .factory("events", function ($rootScope, $firebaseArray) {
      //Declare the value to return (Maybe this should be a service)
      var events = {};

      /**
       * Set to true once events have been loaded.  Used for loading screens
       * @type {boolean}
       */
      events.loaded = false;

      /**
       * Declare the Firebase object for the events
       */
      events.fb = new Firebase(eakjbMowingCalendar.firebaseEventsUrl);

      /**
       * An array of all events
       * This is utilized by the bootstrap calender API to display the events
       * @type {Array}
       */
      events.events = [];

      /**
       * Once each child is loaded, populate the array.
       */
      events.fb.on("child_added", function (e) {
        //Populate the url field for the bootstrap calendar API
        //This page will display details
        var event = e.val();
        if (!event.url) {
          event.url = "event.html#?event=" + e.key();
        }

        //If an event has already has a bid placed, give it the warning class
        if (!event.class) {
          if (!e.child("bids").val()) {
            event.class = "event-success";
          } else {
            if (Object.keys(e.child("bids").val()).length > 0) {
              event.class = event.fixedPrice ? "event-important" : "event-warning";
            } else {
              event.class = "event-success";
            }
          }
        }

        events.events.push(event);
      });

      //Set loaded to true when events are loaded
      events.fb.on("value", function () {
        $rootScope.$apply(function () {
          events.loaded = true;
        });
      });

      return events;
    })

    //Controller for the about page
    .controller("EakjbAboutController", function ($scope, $firebaseArray) {
      //Configure the google map centered at the lawn mowing HQ
      if (google) {
        //todo move lat and lng to firebase or use existing address field
        var myCenter = new google.maps.LatLng(39.540123, -104.977581);

        //Configure maps
        var mapProp = {
          center: myCenter,
          zoom: 18,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        //Create the google map element
        var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

        //Add the pin to the map
        var marker = new google.maps.Marker({
          position: myCenter
        });
        marker.setMap(map);
      }

      //Populate contact information from Firebase
      $scope.contacts = $firebaseArray(new Firebase(eakjbMowingCalendar.firebaseContactUrl));
    })

    //Dummy controller for all static pages
    .controller("EakjbStaticController", function ($scope,$location) {
      $scope.$location = $location;
    })

    //Controller for the nav bar
    .controller("EakjbNavController", function ($scope, $location) {
      $scope.$location = $location;
      $scope.isActive = function (path) {
        return path == $location.path();
      };
    })

    //Controller for calendar view
    .controller("EakjbCalendarController", function ($scope, events) {
      $scope.events = events;

      //Once the values have loaded, create the bootstrap calendar
      events.fb.on("value", function () {
        //Create the calendar using JQuery
        var calendar = $("#calendar").calendar(
          {
            //Path to the calendars templates
            tmpl_path: "bower_components/bootstrap-calendar/tmpls/",

            //ID of the bootstrap modal, a popup window
            modal: "#events-modal",
            events_source: function () {
              return events.events;
            },
            onAfterViewLoad: function (view) {
              $("#dateLabel").text(this.getTitle());
            }
          });

        //Create the calendar navigation buttons
        $('.btn-group button[data-calendar-nav]').each(function () {
          var $this = $(this);
          $this.click(function () {
            calendar.navigate($this.data('calendar-nav'));
          });
        });

        //Create the calendar view buttons
        $('.btn-group button[data-calendar-view]').each(function () {
          var $this = $(this);
          $this.click(function () {
            calendar.view($this.data('calendar-view'));
          });
        });
      });
    })

    //Controller for the admin page
    .controller("EakjbAdminController", function ($scope, events) {
      $scope.title = "Normal Mow"
      $scope.backToBackRepeats = 0;
      $scope.price = 20;

      //Initialize date and time pickers
      var start = $('#datetimepicker1');
      start.datetimepicker();
      var end = $('#datetimepicker2');
      end.datetimepicker();

      //Submit event
      $("#submit").click(function () {
        //Clone the moments from the pickers
        var startMoment = start.data("DateTimePicker").date().clone();
        var endMoment = end.data("DateTimePicker").date().clone();
        var diff = endMoment.clone().subtract(startMoment);

        //Create an event for each back to back repeat
        for (var i = 0; i < $scope.backToBackRepeats + 1; i++) {
          events.fb.push({
            class: "event-info",
            start: startMoment.valueOf(),
            end: endMoment.valueOf(),
            id: 0,
            price: $scope.price,
            title: $scope.title + " (" + startMoment.format("lll") + " - " + endMoment.format("LT") + ")"
          }, function () {
            alert("Submitted.");
          });

          //Create dates for the next repetition
          startMoment = endMoment;
          endMoment = startMoment.clone();
          startMoment.add(1, "minute");
          endMoment.add(diff);
        }
      });
    });
}($, angular, google, Firebase, eakjbMowingCalendar));
