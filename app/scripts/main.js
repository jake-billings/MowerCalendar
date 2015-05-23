(function ($, angular, google, Firebase, eakjbMowingCalendar) {
  angular.module("eakjbMowingCalendar", ["ngRoute", "firebase"])
    .config(function ($routeProvider) {
      $routeProvider
        .when("/calendar", {
          controller: "EakjbCalendarController",
          templateUrl: "templates/calendar.html"
        }).when("/admin", {
          controller: "EakjbAdminController",
          templateUrl: "templates/admin.html"
        }).when("/about", {
          controller: "EakjbStaticController",
          templateUrl: "templates/about.html"
        }).when("/contact", {
          controller: "EakjbContactController",
          templateUrl: "templates/contact.html"
        }).otherwise({
          redirectTo: "/calendar"
        })
    })
    .factory("events", function ($rootScope, $firebaseArray) {
      var events = {};
      events.loaded = false;
      events.fb = new Firebase(eakjbMowingCalendar.firebaseEventsUrl);
      events.events = [];
      events.fb.on("child_added", function (e) {
        var event = e.val();
        if (!event.url) {
          event.url = "event.html#?event=" + e.key();
        }
        if (!event.class) {
          if (!e.child("bids").val()) {
            event.class = "event-success";
          } else {
            event.class = (Object.keys(e.child("bids").val()).length > 0) ? "event-warning" : "event-success";
          }
        }
        events.events.push(event);
      });
      events.fb.on("value", function () {
        $rootScope.$apply(function () {
          events.loaded = true;
        });
      });
      return events;
    })
    .controller("EakjbContactController", function () {
      var myCenter = new google.maps.LatLng(39.540123, -104.977581);
      var mapProp = {
        center: myCenter,
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

      var marker = new google.maps.Marker({
        position: myCenter
      });

      marker.setMap(map);
    })
    .controller("EakjbStaticController", function ($scope) {

    })
    .controller("EakjbNavController", function ($scope, $location) {
      $scope.$location = $location;
      $scope.isActive = function (path) {
        return path == $location.path();
      };
    })
    .controller("EakjbCalendarController", function ($scope, events) {
      $scope.events = events;
      events.fb.on("value", function () {
        var calendar = $("#calendar").calendar(
          {
            tmpl_path: "bower_components/bootstrap-calendar/tmpls/",
            modal: "#events-modal",
            events_source: function () {
              return events.events;
            },
            onAfterViewLoad: function (view) {
              $("#dateLabel").text(this.getTitle());
            }
          });

        $('.btn-group button[data-calendar-nav]').each(function () {
          var $this = $(this);
          $this.click(function () {
            calendar.navigate($this.data('calendar-nav'));
          });
        });

        $('.btn-group button[data-calendar-view]').each(function () {
          var $this = $(this);
          $this.click(function () {
            calendar.view($this.data('calendar-view'));
          });
        });
      });
    }).controller("EakjbAdminController", function ($scope, events) {
      $scope.title = "Normal Mow"
      $scope.backToBackRepeats = 0;
      $scope.price = 20;

      var start = $('#datetimepicker1');
      start.datetimepicker();
      var end = $('#datetimepicker2');
      end.datetimepicker();

      $("#submit").click(function () {
        var startMoment = start.data("DateTimePicker").date().clone();
        var endMoment = end.data("DateTimePicker").date().clone();
        var diff = endMoment.clone().subtract(startMoment);
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
          startMoment = endMoment;
          endMoment = startMoment.clone();
          startMoment.add(1, "minute");
          endMoment.add(diff);
        }
      });
    });
}($, angular, google, Firebase, eakjbMowingCalendar));
