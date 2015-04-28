"use strict";
angular.module('bsiads', [
  "angularFileUpload",
])
.controller('BsiAds', [ '$scope', '$upload', function BsiAds($scope, $upload) {
  $scope.testEnv = false;
  $scope.merchant = "L7AX8DDDDXCWC";
  if ($scope.testEnv) {
    $scope.merchant = "tim@dierks.org";
  }

  $scope.order = {
    'testEnv': $scope.testEnv,
    'merchant': $scope.merchant,
    'name': "",
    'email': "",
    'phone': "",
    'ad_type': null,
    'ad_size': null,
    'ad_layout': null,
    'ad_font': null,
    'ad_text': "",
    'ad_design': null,
    'image': [],
  }
  
  $scope.processing = false;
  $scope.submitted = false;
  
  $scope.TYPES = [
    {
      'id': 'BUSINESS',
      'text': 'Business'
    },
    {
      'id': 'FAMILY',
      'text': 'Family'
    },
  ];
  
  $scope.SIZES = [
    {
      'id': 'FULL_INSIDE_BACK',
      'text': 'Full Page Inside Back Cover (4.875" x 7.875")',
      'price': 750,
      'size': { 'w': 1463, 'h': 2363 },
      'text_size': 800,
    },
    {
      'id': 'FULL_INSIDE_FRONT',
      'text': 'Full Page Inside Front Cover (4.875" x 7.875")',
      'price': 650,
      'size': { 'w': 1463, 'h': 2363 },
      'text_size': 800,
    },
    {
      'id': 'FULL',
      'text': 'Full Page (4.875" x 7.875")',
      'price': 450,
      'size': { 'w': 1463, 'h': 2363 },
      'text_size': 800,
    },
    {
      'id': 'HALF',
      'text': 'Half Page (4.875" x 3.875")',
      'price': 300,
      'size': { 'w': 1463, 'h': 1163 },
      'text_size': 400,
    },
    {
      'id': 'QUARTER',
      'text': 'Quarter Page (2.375" x 3.875")',
      'price': 200,
      'size': { 'w': 713, 'h': 1163 },
      'text_size': 200,
    },
    {
      'id': 'EIGHTH',
      'text': 'Eighth Page (2.375" x 1.875")',
      'price': 100,
      'size': { 'w': 713, 'h': 563 },
      'text_size': 100,
    },
  ];
  
  $scope.LAYOUTS = [
    {
      'id': 'IMAGE',
      'text': 'I am providing a ready to print ad',
      'has_image': true,
      'has_text': false,
      'has_colors': false,
    },
    {
      'id': 'IMAGE_TEXT',
      'text': 'I am providing an image and text',
      'has_image': true,
      'has_text': true,
      'has_colors': false,
    },
    {
      'id': 'TEXT',
      'text': 'I am providing text for a text-only ad',
      'has_image': false,
      'has_text': true,
      'has_colors': true,
    },
  ];
  
  $scope.valid = function valid() {
    return $scope.orderForm.$valid && (!$scope.order.ad_layout.has_image || $scope.order.image.length > 0);
  }
  
  $scope.upload = function upload() {
    var fields = {
      'name': $scope.order.name,
      'email': $scope.order.email,
      'phone': $scope.order.phone,
      'ad_type': $scope.order.ad_type.text,
      'ad_size': $scope.order.ad_size.text,
      'ad_layout': $scope.order.ad_layout.text,
    };
    var file = [];
    if ($scope.order.ad_layout.has_image) {
      file = $scope.order.image[0];
    }
    if ($scope.order.ad_layout.has_text) {
      fields['ad_text'] = $scope.order.ad_text;
      fields['ad_font'] = $scope.order.ad_font;
    }
    if ($scope.order.ad_layout.has_colors) {
      fields['ad_design'] = $scope.order.ad_design;
    }
    
    $upload.upload({
      'url': 'submit-ad',
      'file': file,
      'fields': fields,
    }).progress(function(evt) {
      console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file :'+ evt.config.file.name);
    }).success(function(data, status, headers, config) {
      // file is uploaded successfully
      console.log('file ' + config.file.name + 'is uploaded successfully. Response: ' + data);
      $scope.processing = false;
      $scope.submitted = true;
    }).error(function() {
      console.log('error');
    });
    $scope.processing = true;
  };
  
  $scope.$on("cropme:done", function(ev, result, canvasEl) {
    console.log(result);
  });
  $scope.$on("cropme:loaded", function(ev, width, height) {
    console.log("Width " + width + ", height " + height);
  });
}])
.directive('buyButton', [function buyButton() {
  function link(scope, element, attrs) {
    scope.$watch("order",
      function updatePaypalButton(order) {
        var itemNumber = 0;
        var paypalCart = {
          no_shipping: { value: "1" },
          custom: { value: order.name },
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

        if (order.ad_size) {
          addItem({
            name: order.ad_size.text,
            amount: order.ad_size.price,
          });
        }

        while (element[0].firstChild) {
          element[0].removeChild(element[0].firstChild);
        }
        if (order.ad_size) {
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