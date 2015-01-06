"use strict";

angular.module('bsicyclones', [
])
.controller('BsiCyclonesCtrl', ['$scope', '$http', function BsiGalaCtrl($scope, $http) {
  $scope.testEnv = false;
  $scope.merchant = "L7AX8DDDDXCWC";
  
  if ($scope.testEnv) {
    $scope.merchant = "tim@dierks.org";
  }
  
  $scope.classrooms = [];
  $scope.allrooms = [];
  
  $scope.selected = {
    "classroom": null,
    "family": null,
    "familyClasses": null,
  };
  
  $scope.NONE = "NONE";
  
  $scope.resetOrder = function resetOrder() {
    $scope.order = {
      testEnv: $scope.testEnv,
      merchant: $scope.merchant,
      family: null,
      tickets: 0,
      ticketPrice: 16,
      willCallName: "",
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
    $scope.resetOrder();
    $scope.order.family = family;
    $scope.order.familyClasses = $scope.familyClassrooms(family);
    $scope.order.willCallName = family;
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
  
  $scope.totalPrices = function totalPrices() {
    var tickets = $scope.order.tickets * $scope.order.ticketPrice;
    return {
      tickets: tickets,
      total: tickets,
    };
  }
}])
.directive('buyButton', [function buyButton() {
  function link(scope, element, attrs) {
    scope.$watch("order",
      function updatePaypalButton(order) {
        var itemNumber = 0;
        var paypalCart = {
          no_shipping: { value: "1" },
          custom: { value: (order.family || "") + ": " + (order.familyClasses || []).join(", ") },
        };
        
        if (order.testEnv) {
          paypalCart.env = { value: "sandbox" };
        }
        
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
            name: "Cyclones Ticket",
            quantity: order.tickets,
            amount: order.ticketPrice,
            detailName: "Will-call under",
            detailInfo: order.willCallName,
          });
        }
          
        while (element[0].firstChild) {
          element[0].removeChild(element[0].firstChild);
        }
        if (itemNumber > 0) {
          PAYPAL.apps.ButtonFactory.create(
            order.merchant,
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