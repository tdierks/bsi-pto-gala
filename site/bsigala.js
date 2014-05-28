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
      taFundGift: 0,
      ads: {
        full: 0,
        half: 0,
        quarter: 0,
        eighth: 0,
        fullPrice: 500,
        halfPrice: 250,
        quarterPrice: 125,
        eighthPrice: 75.
      },
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
  
  $scope.formatRoom = function formatRoom(classroom) {
    var c = classroom.charAt(0);
    if (c == "0") {
      return "K-"+classroom;
    } else {
      return c+"-"+classroom;
    }
  }
  
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
    var taFundGift = parseInt($scope.order.taFundGift, 10);
    if (!taFundGift || taFundGift == NaN) taFundGift = 0;
    var classPages = 0;
    angular.forEach($scope.order.classPages, function ocPriceLoop(input, cr) {
      var amount = parseInt(input, 10);
      if (amount && amount != NaN) {
        classPages += amount;
      }
    });
    var appreciations = $scope.orderedAppreciations().length * $scope.order.appreciationPrice;
    var adsPrices = {
      full: $scope.order.ads.full * $scope.order.ads.fullPrice,
      half: $scope.order.ads.half * $scope.order.ads.halfPrice,
      quarter: $scope.order.ads.quarter * $scope.order.ads.quarterPrice,
      eighth: $scope.order.ads.eighth * $scope.order.ads.eighthPrice,
    };
    adsPrices.total = adsPrices.full + adsPrices.half + adsPrices.quarter + adsPrices.eighth;
    return {
      tickets: tickets,
      taFundGift: taFundGift,
      classPages: classPages,
      appreciations: appreciations,
      ads: adsPrices,
      total: tickets + classPages + appreciations + adsPrices.total + taFundGift,
    };
  }
}])
.directive('buyButton', [function buyButton() {
  function link(scope, element, attrs) {
    scope.$watch("order",
      function updatePaypalButton(order) {
        var itemNumber = 0;
        var paypalCart = {
//           env: { value: "sandbox" },
          no_shipping: { value: "1" },
          custom: { value: order.family },
        };
        
        function addItem(item) {
          itemNumber++;
          paypalCart['item_name_'+itemNumber] = { value: item.name };
          paypalCart['amount_'+itemNumber] = { value: item.amount };
          if (item.quantity) paypalCart['quantity_'+itemNumber] = { value: item.quantity };
          if (item.detailName) paypalCart['on0_'+itemNumber] = { value: item.detailName };
          if (item.detailInfo) paypalCart['os0_'+itemNumber] = { value: item.detailInfo };
        }

        if (order.tickets > 0) {
          addItem({
            name: "Gala Ticket",
            quantity: order.tickets,
            amount: order.ticketPrice,
            detailName: "For",
            detailInfo: order.family,
          });
          
          angular.forEach(order.biddingPaddles, function obp(bidder) {
            addItem({
              name: "Bidding Paddle",
              quantity: "1",
              amount: "0.00",
              detailName: "For",
              detailInfo: bidder.name,
            });
          });
        }
        if (order.taFundGift) {
          addItem({
            name: "TA fund gift",
            amount: order.taFundGift,
          });
        }
        angular.forEach(order.classPages, function(input, classroom) {
          var amount = parseInt(input, 10);
          if (amount) {
            addItem({
              name: "Support for class " + classroom + " page",
              amount: amount,
            });
          }
        });
        angular.forEach(order.appreciations, function(appreciation, classroom) {
          if (appreciation.purchase) {
            addItem({
              name: "Appreciation for class " + classroom,
              amount: order.appreciationPrice,
              detailName: "Message",
              detailInfo: appreciation.message,
            });
          }
        });
        if (order.ads.full) {
          addItem({
            name: "Full-page ad",
            amount: order.ads.fullPrice,
            quantity: order.ads.full,
          });
        }
        if (order.ads.half) {
          addItem({
            name: "Half-page ad",
            amount: order.ads.halfPrice,
            quantity: order.ads.half,
          });
        }
        if (order.ads.quarter) {
          addItem({
            name: "Quarter-page ad",
            amount: order.ads.quarterPrice,
            quantity: order.ads.quarter,
          });
        }
        if (order.ads.eighth) {
          addItem({
            name: "Eighth-page ad",
            amount: order.ads.eighthPrice,
            quantity: order.ads.eighth,
          });
        }
        while (element[0].firstChild) {
          element[0].removeChild(element[0].firstChild);
        }
        if (itemNumber > 0) {
          PAYPAL.apps.ButtonFactory.create(
            "L7AX8DDDDXCWC",
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