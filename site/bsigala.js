"use strict";

angular.module('bsigala', [
])
.controller('BsiGalaCtrl', ['$scope', '$http', function BsiGalaCtrl($scope, $http) {

  $scope.classrooms = [];
  $scope.allrooms = [];
  
  $scope.selected = {
    "classroom": null,
    "family": null,
    "appreciationRoomToAdd": null,
  };
  
  $scope.NONE = "NONE";
  
  $scope.resetOrder = function resetOrder() {
    $scope.order = {
      family: null,
      tickets: 0,
      ticketPrice: 65,
      classPages: {},
      appreciationClasses: [],
      appreciations: {},
      appreciationPrice: 30,
      biddingPaddles: [],
    };
  }
  $scope.resetOrder();
  
  $http.get('/classrooms.json')
    .then(function(res) {
      $scope.classrooms = res.data;
      angular.forEach($scope.classrooms, function allroomsLoop(c) {
        $scope.allrooms.push(c.room);
      });
      $scope.allrooms.sort();
    });
  
  $scope.classParentsFilter = function classParentsFilter(family) {
    return function classHasParents(c) {
      return c.parents.indexOf(family) >= 0;
    }
  };
  
  $scope.chooseClassroom = function chooseClassroom(classroom) {
    if (!classroom) {
      $scope.selected.classroom = classroom;
    } else {
      angular.forEach($scope.classrooms, function chooseClassloop(c) {
        if (c.room == classroom) {
          $scope.selected.classroom = c;
        }
      });
    }
    $scope.resetOrder();
  };
  
  $scope.noClassroom = function noClassroom() {
    $scope.selected.classroom = $scope.NONE;
    $scope.resetOrder();
  };
  
  $scope.chooseFamily = function chooseFamily(family) {
    var familyClasses = $scope.familyClassrooms(family);
    $scope.resetOrder();
    $scope.order.family = family;
    $scope.order.appreciationClasses = familyClasses;
    angular.forEach(familyClasses, function(c) {
      $scope.order.classPages[c] = 0;
    });
  };
  
  $scope.familyClassrooms = function familyClassrooms(family) {
    var familyClasses = [];
    angular.forEach($scope.classrooms, function familyClassLoop(c) {
      if (c.parents.indexOf(family) >= 0) {
        familyClasses.push(c.room);
      }
    });
    return familyClasses;
  };
  
  $scope.appreciationForClass = function appreciationForClass(classroom) {
    if (!$scope.order.appreciations.hasOwnProperty(classroom)) {
      $scope.order.appreciations[classroom] = {
        'purchase': false,
        'message': "",
      };
    }
    return $scope.order.appreciations[classroom];
  };
  
  $scope.addAppreciationRoom = function addAppreciationRoom() {
    $scope.order.appreciationClasses.push($scope.selected.appreciationRoomToAdd);
    $scope.selected.appreciationRoomToAdd = null;
  };
  
  $scope.orderedClassPages = function orderedClassPages() {
    var ocp = [];
    angular.forEach($scope.order.classPages, function ocpLoop(amount, cr) {
      if (amount) {
        ocp.push(cr);
      }
    });
    return ocp;
  };
  
  $scope.orderedAppreciations = function orderedAppreciations() {
    var oa = [];
    angular.forEach($scope.order.appreciationClasses, function oaLoop(cr) {
      if ($scope.order.appreciations[cr] && $scope.order.appreciations[cr].purchase) {
        oa.push(cr);
      }
    });
    return oa;
  };
  
  $scope.getBiddingPaddles = function getBiddingPaddles() {
    if ($scope.order.biddingPaddles.length == 0) {
      $scope.order.biddingPaddles.push( { name: $scope.order.family } );
    }
    return $scope.order.biddingPaddles;
  }

  $scope.addBiddingPaddle = function addBiddingPaddle() {
    $scope.order.biddingPaddles.push( { name: "" } );
  }
  
  $scope.removeBiddingPaddle = function removeBiddingPaddle(index) {
    $scope.order.biddingPaddles.splice(index, 1);
  }
  
  $scope.unusedRooms = function unusedRooms(used) {
    var unused = [];
    var ud = {};
    angular.forEach(used, function(r) {
      ud[r] = true;
    });
    angular.forEach($scope.allrooms, function(r) {
      if (!(r in ud)) {
        unused.push(r);
      }
    });
    return unused;
  }
  
  $scope.totalPrices = function totalPrices() {
    var tickets = $scope.order.tickets * $scope.order.ticketPrice;
    var classPages = 0;
    angular.forEach($scope.order.classPages, function ocPriceLoop(input, cr) {
      var amount = parseInt(input, 10);
      if (amount && amount != NaN) {
        classPages += amount;
      }
    });
    var appreciations = $scope.orderedAppreciations().length * $scope.order.appreciationPrice;
    return {
      tickets: tickets,
      classPages: classPages,
      appreciations: appreciations,
      total: tickets + classPages + appreciations,
    };
  }
}])
.directive('buyButton', [function buyButton() {
  function link(scope, element, attrs) {
    scope.$watch("order",
      function updatePaypalButton(order) {
        var paypalCart = {
          env: { value: "sandbox" },
          no_shipping: { value: "1" },
          custom: { value: order.family },
        };
        var itemNumber = 0;
        
        if (order.tickets > 0) {
          itemNumber++;
          paypalCart['item_name_'+itemNumber] = { value: "Gala Ticket" };
          paypalCart['quantity_'+itemNumber] = { value: order.tickets };
          paypalCart['amount_'+itemNumber] = { value: order.ticketPrice };
          paypalCart['on0_'+itemNumber] = { value: "For" };
          paypalCart['os0_'+itemNumber] = { value: order.family };
        }
        angular.forEach(order.classPages, function(input, classroom) {
          var amount = parseInt(input, 10);
          if (amount) {
            itemNumber++;
            paypalCart['item_name_'+itemNumber] = { value: "Support for class " + classroom + " page" };
            paypalCart['amount_'+itemNumber] = { value: amount };
          }
        });
        angular.forEach(order.appreciations, function(appreciation, classroom) {
          if (appreciation.purchase) {
            itemNumber++;
            paypalCart['item_name_'+itemNumber] = { value: "Appreciation for class " + classroom };
            paypalCart['amount_'+itemNumber] = { value: order.appreciationPrice };
            paypalCart['on0_'+itemNumber] = { value: "Message" };
            paypalCart['os0_'+itemNumber] = { value: appreciation.message };
          }
        });
        while (element[0].firstChild) {
          element[0].removeChild(element[0].firstChild);
        }
        if (itemNumber > 0) {
          PAYPAL.apps.ButtonFactory.create(
            "tim-facilitator@dierks.org",
            paypalCart,
            "uploadcart",
            element[0]);
        }
      },
      true);
  }
  return {
    scope: {
      order: '=',
    },
    restrict: 'E',
    link: link,
  };
}])
;