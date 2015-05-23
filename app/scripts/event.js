(function($,angular,Firebase,eakjbMowingCalendar) {
  angular.module("eakjbMowingCalendarEvent",["firebase"])
    .controller("EakjbEventController", function($scope,$location,$firebaseObject,$firebaseArray) {
      $firebaseObject(new Firebase(eakjbMowingCalendar.firebaseEventsUrl+"/"+$location.search()["event"])).$bindTo($scope,"event");
      $scope.bids=$firebaseArray(new Firebase(eakjbMowingCalendar.firebaseEventsUrl+"/"+$location.search()["event"]+"/bids"));
      $scope.loaded=false;
      $scope.data={
        price:20,
        owner:"",
        property:"",
        timestamp:Firebase.ServerValue.TIMESTAMP
      };

      $scope.isHighestBid = function(other) {
        return other==$scope.highestBid;
      };

      $scope.submit = function() {
        if (!isNaN($scope.data.price)&&
          $scope.data.owner&&$scope.data.owner!==""&&
          $scope.data.property&&$scope.data.property!=="")
          $scope.bids.$add($scope.data);
      };
      $scope.bids.$loaded(function() {
        $scope.loaded=true;
      });
      $scope.bids.$watch(function () {
        $scope.highestBid = undefined;
        angular.forEach($scope.bids,function(bid) {
          if (!$scope.highestBid) {
            $scope.highestBid=bid;
          } else {
            if (bid.price>$scope.highestBid.price) {
              $scope.highestBid=bid;
            }
          }
        });

        if ($scope.highestBid) $scope.data.price=$scope.highestBid.price+5;
      });
    });
}($,angular,Firebase,eakjbMowingCalendar));
