"use strict";

angular.module('bsigala', [
])
.controller('BsiGalaCtrl', ['$scope', '$http', function BsiGalaCtrl($scope, $http) {
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
  };
  
  $scope.resetOrder = function resetOrder() {
    $scope.order = {
      testEnv: $scope.testEnv,
      merchant: $scope.merchant,
      family: null,
      classroom: null,
      tickets: 0,
      staff: 0,
      ticketPrice: function ticketPrice() {
        var price = 0;
        if ($scope.order.tickets >= 1) {
          price = 20;
        }
        if ($scope.order.tickets >= 2) {
          price += 12;
        }
        if ($scope.order.tickets > 2) {
          price += ($scope.order.tickets - 2) * 8;
        }
        return price;
      },
      staffPrice: function staffPrice() {
        var price = 0;
        if ($scope.order.staff) {
          price += ($scope.order.staff) * 8;
        }
        return price;
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
  
  $scope.noClassroom = function noClassroom(group) {
    $scope.selected.classroom = group;
    $scope.resetOrder();
  };
  
  $scope.chooseFamily = function chooseFamily(family) {
    var familyClasses = $scope.familyClassrooms(family);
    $scope.resetOrder();
    $scope.order.family = family;
    $scope.order.classroom = $scope.selected.classroom;
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
    var ticketPrice = $scope.order.ticketPrice();
    var staffPrice = $scope.order.staffPrice();
    return {
      tickets: ticketPrice,
      staff: staffPrice,
      total: ticketPrice + staffPrice,
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
          custom: { value: order.family },
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
          var classText = ""
          if (order.classroom != null) {
            classText = ", class " + order.classroom.room;
          }
          addItem({
            name: "Ice Skating for " + order.tickets + " skaters",
            amount: order.ticketPrice(),
            detailName: "For",
            detailInfo: order.family + classText,
          });
        }
        if (order.staff > 0) {
          addItem({
            name: "Ice Skating for staff",
            amount: 8,
            quantity: order.staff,
            detailName: "For",
            detailInfo: order.family,
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